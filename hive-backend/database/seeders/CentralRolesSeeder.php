<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class CentralRolesSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Define Guard
        $guard = 'web';

        // 2. Create Permissions
        Permission::firstOrCreate(['name' => 'manage tenants', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'view dashboard', 'guard_name' => $guard]);

        // 3. Create Roles
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => $guard]);
        $support = Role::firstOrCreate(['name' => 'Support', 'guard_name' => $guard]);

        // 4. Assign Permissions
        $superAdmin->givePermissionTo(Permission::where('guard_name', $guard)->get());
        $support->givePermissionTo('view dashboard');

        // REMOVED: User creation logic.
        // That now lives exclusively in CentralUsersSeeder.php
    }
}
