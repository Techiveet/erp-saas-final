<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

// Mailables
use App\Mail\UserCreated;
use App\Mail\UserUpdated;
use App\Mail\UserStatusChanged;

class UserController extends Controller
{
    private function getContext(): array
    {
        $isTenant = function_exists('tenancy') && tenancy()->initialized;
        return [
            'guard' => $isTenant ? 'tenant' : 'web',
            'type'  => $isTenant ? 'Tenant Employee' : 'Central Admin',
        ];
    }

    private function isProtected(User $user): bool
    {
        return $user->id === 1 || $user->hasRole('Super Admin');
    }

    /**
     * ✅ Helper: Smart Cache Clearing
     */
    private function clearUserCache(User $user = null): void
    {
        // 1. Clear General Stats (Redis)
        $key = 'user_stats_' . $this->getContext()['guard'];
        Cache::forget($key);

        // 2. Clear Individual Profile Cache (Redis)
        if ($user) {
            Cache::forget("user_profile_{$user->id}");
        }
    }

    // 1. LIST USERS (Meilisearch + Redis Stats)
    public function index(Request $request)
    {
        $perPage = $request->input('pageSize', 10);
        $search  = $request->input('search', '');
        $context = $this->getContext();

        // ✅ REDIS: Cache stats for 10 minutes to reduce DB load
        $statsKey = 'user_stats_' . $context['guard'];
        $stats = Cache::remember($statsKey, 600, function () {
            return [
                'total_users'     => User::count(),
                'active_users'    => User::where('is_active', true)->count(),
                'new_this_week'   => User::where('created_at', '>=', now()->subWeek())->count(),
            ];
        });

        // ✅ MEILISEARCH QUERY
        $query = User::search($search);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('is_active', $request->status === 'active');
        }

        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', Carbon::parse($request->date_from)->timestamp);
        }
        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', Carbon::parse($request->date_to)->endOfDay()->timestamp);
        }

        $sortBy  = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_direction', 'desc');
        $allowedSorts = ['name', 'email', 'created_at', 'id'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $users = $query->paginate($perPage);
        $users->load('roles');

        return response()->json([
            'meta'         => array_merge($context, ['stats' => $stats]),
            'users'        => $users->items(),
            'total'        => $users->total(),
            'per_page'     => $users->perPage(),
            'current_page' => $users->currentPage(),
        ]);
    }

    // 2. CREATE USER (Instant UI Response)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'   => 'required|string|max:255',
            'email'  => 'required|email|unique:users,email',
            'role'   => 'required|string|exists:roles,name',
            'avatar' => 'nullable|image|max:2048',
        ]);

        if ($request->role === 'Super Admin') {
            return response()->json(['message' => 'You cannot create a Super Admin user.'], 403);
        }

        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
        }

        $randomPassword = Str::random(32);

        $user = User::create([
            'name'        => $validated['name'],
            'email'       => $validated['email'],
            'password'    => Hash::make($randomPassword),
            'is_active'   => true,
            'avatar_path' => $avatarPath,
        ]);

        $user->assignRole($request->role);

        // ✅ Clear Cache
        $this->clearUserCache();

        // ✅ Queue Email (Returns instantly)
        $token = Password::createToken($user);
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        $setDetailsUrl = "{$frontendUrl}/auth/reset-password?token={$token}&email={$user->email}";

        try {
            Mail::to($user->email)->queue(new UserCreated($user, $setDetailsUrl));
        } catch (\Exception $e) {
            \Log::error("Failed to queue Welcome Email: " . $e->getMessage());
        }

        return response()->json($user, 201);
    }

    // 3. SHOW USER (Cached Profile)
    public function show($id)
    {
        // ✅ REDIS: Cache individual profile for 1 hour.
        // Makes viewing details instant.
        $user = Cache::remember("user_profile_{$id}", 3600, function () use ($id) {
            return User::with('roles')->findOrFail($id);
        });

        return response()->json($user);
    }


   // 4. UPDATE USER
    public function update(Request $request, User $user)
    {
        if ($this->isProtected($user)) {
            return response()->json(['message' => 'The Central Super Admin cannot be modified.'], 403);
        }

        if ($request->input('role') === 'Super Admin') {
            return response()->json(['message' => 'You cannot assign the Super Admin role.'], 403);
        }

        $request->validate([
            'name'          => 'sometimes|string|max:255',
            'email'         => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'password'      => 'nullable|string|min:8',
            'role'          => 'sometimes|string|exists:roles,name',
            'avatar'        => 'nullable|image|max:2048',
            'remove_avatar' => 'nullable|boolean',
        ]);

        // Avatar Handling
        if ($request->boolean('remove_avatar')) {
            if ($user->avatar_path) Storage::disk('public')->delete($user->avatar_path);
            $user->avatar_path = null;
        }

        if ($request->hasFile('avatar')) {
            if ($user->avatar_path) Storage::disk('public')->delete($user->avatar_path);
            $user->avatar_path = $request->file('avatar')->store('avatars', 'public');
        }

        // ✅ 1. Capture Raw Password BEFORE Hashing
        $rawPassword = null;
        if ($request->filled('password')) {
            $rawPassword = $request->password; // Save plain text for email
            $user->password = Hash::make($rawPassword); // Hash for DB
        }

        $user->fill($request->only(['name', 'email']));
        $user->save();

        // ✅ 2. Capture Changes
        $changes = $user->getChanges();

        // Remove internal timestamp
        unset($changes['updated_at']);

        // Handle Password for Email
        if ($rawPassword) {
            // Replace the hashed password with the raw one for the email
            $changes['New Password'] = $rawPassword;
            unset($changes['password']); // Remove the ugly hash string
        }

        // Handle Avatar for Email (make it readable)
        if (isset($changes['avatar_path'])) {
            $changes['Profile Photo'] = 'Updated';
            unset($changes['avatar_path']);
        }

        // Role Sync
        if ($request->has('role')) {
            $currentRole = $user->roles->first()?->name;
            $newRole = $request->role;

            if ($currentRole !== $newRole) {
                $user->syncRoles([$newRole]);
                $changes['Role'] = "$currentRole ➝ $newRole";
            }
        }

        $this->clearUserCache($user);

        // ✅ 3. Send Email with Raw Password
        if (!empty($changes)) {
            try {
                Mail::to($user->email)->queue(new UserUpdated($user, $changes));
            } catch (\Exception $e) {
                \Log::error("Failed to queue Update Email: " . $e->getMessage());
            }
        }

        return response()->json($user);
    }

    // 5. DELETE USER
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if ($this->isProtected($user)) {
            return response()->json(['message' => 'CRITICAL: Cannot delete the Central Super Admin.'], 403);
        }

        if ($user->avatar_path && Storage::disk('public')->exists($user->avatar_path)) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->delete();
        $this->clearUserCache($user);

        return response()->json(['message' => 'User deleted successfully']);
    }

    // 6. TOGGLE STATUS
    public function toggleStatus($id)
    {
        $user = User::findOrFail($id);

        if ($this->isProtected($user)) {
            return response()->json(['message' => 'Cannot deactivate the Central Super Admin.'], 403);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        $this->clearUserCache($user);

        try {
            Mail::to($user->email)->queue(new UserStatusChanged($user));
        } catch (\Exception $e) {
            \Log::error("Failed to queue Status Email: " . $e->getMessage());
        }

        $status = $user->is_active ? 'activated' : 'deactivated';

        return response()->json([
            'message' => "User has been $status successfully.",
            'user'    => $user
        ]);
    }
}
