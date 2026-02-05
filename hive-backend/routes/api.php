<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Export\PermissionExportController;
use App\Http\Controllers\Api\Export\RoleExportController;
use App\Http\Controllers\Api\Export\UserExportController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\TwoFactorController;


foreach (config('tenancy.central_domains') as $domain) {

    Route::domain($domain)->middleware('api')->group(function () {

        // ===============================
        // PUBLIC ROUTES
        // ===============================
        Route::post('/login', [AuthController::class, 'login']);

        // ===============================
        // PROTECTED ROUTES
        // ===============================
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/users/export', [UserExportController::class, 'handleExport']);
            // Auth
            Route::get('/user', [AuthController::class, 'user']);
            Route::post('/logout', [AuthController::class, 'logout']);

            // ACL
            Route::get('/roles/export', [RoleExportController::class, 'handleExport']);
            Route::get('/permissions/export', [PermissionExportController::class, 'handleExport']);
            Route::apiResource('permissions', PermissionController::class);
            Route::apiResource('roles', RoleController::class);


            // Users
            Route::apiResource('users', UserController::class);
            Route::post('/users/{user}/toggle-status', [UserController::class, 'toggleStatus']);

            // Two Factor
            Route::prefix('two-factor')->group(function () {
                Route::post('enable', [TwoFactorController::class, 'enable']);
                Route::post('confirm', [TwoFactorController::class, 'confirm']);
                Route::delete('disable', [TwoFactorController::class, 'destroy']);
            });

            // ✅ EXPORT (ONE CLEAN ENDPOINT)


        });
    });
}
