<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tenant; // ✅ Added Tenant Model
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class AuthController extends Controller
{
    /**
     * LOGIN
     * Handles authentication with Tenant Check, Rate Limiting, Deactivation check, and 2FA.
     */
    public function login(Request $request)
    {
        // ---------------------------------------------------------
        // 1. TENANT DOMAIN CHECK (New Logic)
        // ---------------------------------------------------------
        // We get the host (e.g. "apple.localhost" or "localhost")
        $host = $request->getHost();
        $parts = explode('.', $host);

        // If we are on a subdomain (length > 1 means "apple" + "localhost")
        // And we ensure we aren't just hitting the root IP or localhost directly
        if (count($parts) > 1 && $host !== 'localhost') {
            $subdomain = $parts[0]; // e.g., "apple"

            // Check if this tenant ID exists in the database
            // Ensure your Tenant model uses 'id' as the key (e.g., 'apple', 'samsung')
            $tenantExists = Tenant::where('id', $subdomain)->exists();

            if (! $tenantExists) {
                return response()->json([
                    'message' => "The workspace '{$subdomain}' does not exist."
                ], 404); // 404 stops the frontend immediately
            }
        }

        // ---------------------------------------------------------
        // 2. VALIDATE INPUT
        // ---------------------------------------------------------
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'device_name' => 'required|string',
            'otp' => 'nullable|string', // Optional: Only needed if 2FA is on
        ]);

        // ---------------------------------------------------------
        // 3. RATE LIMITING (Prevent Brute Force)
        // ---------------------------------------------------------
        $throttleKey = Str::lower($request->email) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'message' => 'Too many login attempts. Please try again in ' . $seconds . ' seconds.',
            ], 429);
        }

        // ---------------------------------------------------------
        // 4. FIND USER & VERIFY PASSWORD
        // ---------------------------------------------------------
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            RateLimiter::hit($throttleKey); // Count failed attempt
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // ---------------------------------------------------------
        // 5. CHECK ACCOUNT STATUS
        // ---------------------------------------------------------
        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated. Please contact support.',
            ], 403);
        }

        // ---------------------------------------------------------
        // 6. 2FA INTERCEPTION LOGIC
        // ---------------------------------------------------------
        if ($user->two_factor_confirmed_at) {

            // A. If OTP is missing -> Ask for it
            if (! $request->filled('otp')) {
                return response()->json([
                    'message' => 'Two-factor authentication code required.',
                    'two_factor_required' => true,
                ], 422);
            }

            // B. Verify OTP
            $google2fa = new Google2FA();
            $secret = decrypt($user->two_factor_secret);
            $valid = $google2fa->verifyKey($secret, $request->otp, 1);

            if (!$valid) {
                // C. Check Recovery Codes
                $recoveryCodes = $user->two_factor_recovery_codes
                    ? json_decode(decrypt($user->two_factor_recovery_codes), true)
                    : [];

                if (in_array($request->otp, $recoveryCodes)) {
                    // Burn used code
                    $recoveryCodes = array_diff($recoveryCodes, [$request->otp]);
                    $user->forceFill([
                        'two_factor_recovery_codes' => encrypt(json_encode(array_values($recoveryCodes))),
                    ])->save();
                } else {
                    RateLimiter::hit($throttleKey);
                    throw ValidationException::withMessages([
                        'otp' => ['The provided two-factor authentication code is invalid.'],
                    ]);
                }
            }
        }

        // ---------------------------------------------------------
        // 7. SUCCESS: ISSUE TOKEN
        // ---------------------------------------------------------
        RateLimiter::clear($throttleKey);

        // Keep DB clean: remove old tokens for this specific device name
        $user->tokens()->where('name', $request->device_name)->delete();

        $token = $user->createToken($request->device_name)->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => $user->load('roles'),
        ]);
    }

    public function user(Request $request)
    {
        return response()->json($request->user()->load('roles'));
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
