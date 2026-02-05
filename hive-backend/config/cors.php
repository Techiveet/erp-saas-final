<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    // ✅ Crucial: Add 'api/export/*' explicitly to cover the route we just made
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'export/*', 'api/export/*'],

    'allowed_methods' => ['*'],

    // ✅ Crucial: Exact frontend URL
    'allowed_origins' => ['http://localhost:3000'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // ✅ Crucial: Must be true
    'supports_credentials' => true,
];
