<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class TenantRolesSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Define the Guard
        $guard = 'tenant';

        // 2. Create Permissions
        Permission::firstOrCreate(['name' => 'create invoice', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'delete invoice', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'manage employees', 'guard_name' => $guard]);

        // 3. Create Roles
        $admin = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => $guard]);
        $manager = Role::firstOrCreate(['name' => 'Manager', 'guard_name' => $guard]);
        $employee = Role::firstOrCreate(['name' => 'Employee', 'guard_name' => $guard]);

        // 4. Assign Permissions to Roles
        $admin->givePermissionTo(Permission::where('guard_name', $guard)->get());
        $manager->givePermissionTo(['create invoice', 'manage employees']);
        $employee->givePermissionTo(['create invoice']);

        // STOP HERE: Do not create users in this file.
        // We let TenantUsersSeeder handle that.
    }
}
