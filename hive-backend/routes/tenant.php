<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\TwoFactorController;

Route::middleware([
    'api',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->prefix('api')->group(function () {

    // ============================================
    // 1. PUBLIC ROUTES (No Token Required)
    // ============================================

    // ✅ NEW: Tenant Health Check
    // Used by frontend to verify if workspace exists before showing login form.
    Route::get('/check', function () {
        return response()->json(['message' => 'Workspace active']);
    });

    // Login Route
    Route::post('/login', [AuthController::class, 'login']);

    // ============================================
    // 2. PROTECTED ROUTES (Token Required)
    // ============================================
    Route::middleware(['auth:sanctum'])->group(function () {

        // Auth Management
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);

        // --- Access Control (ACL) ---
        Route::apiResource('permissions', PermissionController::class);
        Route::apiResource('roles', RoleController::class);

        // --- User Management ---
        Route::apiResource('users', UserController::class);
        Route::post('/users/{user}/toggle-status', [UserController::class, 'toggleStatus']);

        // --- Two-Factor Authentication ---
        Route::prefix('two-factor')->group(function () {
            Route::post('enable', [TwoFactorController::class, 'enable']);
            Route::post('confirm', [TwoFactorController::class, 'confirm']);
            Route::delete('disable', [TwoFactorController::class, 'destroy']);
        });

    });
});
