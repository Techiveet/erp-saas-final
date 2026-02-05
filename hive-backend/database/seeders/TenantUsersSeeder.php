<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TenantUsersSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Get Tenant Context
        $tenantId = tenant('id');
        $email = "admin@{$tenantId}.localhost";

        // 2. Create the Admin User
        $admin = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => ucfirst($tenantId) . ' Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        // 3. Assign Role (With Explicit Guard Fix)
        if (!$admin->hasRole('Admin', 'tenant')) {
            // FORCE the guard name to 'tenant' on the instance
            // This overrides any default config or accessor logic
            $admin->guard_name = 'tenant';
            $admin->assignRole('Admin');
        }

        // 4. Create Random Employees
        User::factory()->count(5)->create([
            'is_active' => true,
        ])->each(function ($user) {
            // FORCE the guard name here too
            $user->guard_name = 'tenant';
            $user->assignRole('Employee');
        });
    }
}
