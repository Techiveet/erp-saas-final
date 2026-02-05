<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // 1. Roles MUST come first
            CentralRolesSeeder::class,

            // 2. Then Users (who need those roles)
            CentralUsersSeeder::class,

            // 3. Then Tenants (who have their own independent seeders)
            TenantsSeeder::class,
        ]);
    }
}
