<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ExportController;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;

// ...

foreach (config('tenancy.central_domains') as $domain) {
    Route::domain($domain)->group(function () {

        Route::middleware([
            EncryptCookies::class,                 // 1. Decrypt the cookie
            AddQueuedCookiesToResponse::class,     // 2. Allow response cookies
            StartSession::class,                   // 3. Boot the session from the cookie
            // ❌ REMOVED: 'auth:sanctum' (It's too picky about domains)
            // ✅ ADDED: 'auth:web' (Checks the session directly)
            'auth:web'
        ])
        ->prefix('api')
        ->group(function () {

        });
    });
}
