<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB; // <--- Import DB Facade
use Stancl\Tenancy\Jobs\CreateDatabase;
use Stancl\Tenancy\Jobs\MigrateDatabase;
use Stancl\Tenancy\Jobs\DeleteDatabase;

class TenantsSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = [
            ['id' => 'apple', 'name' => 'Apple Inc'],
            ['id' => 'tesla', 'name' => 'Tesla Motors'],
            ['id' => 'spacex', 'name' => 'SpaceX'],
        ];

        foreach ($tenants as $data) {
            $this->createTenant($data);
        }
    }

    private function createTenant(array $data): void
    {
        $this->command->info("🛠️ Processing Tenant: " . $data['name']);

        // ---------------------------------------------------------
        // 1. NUCLEAR CLEANUP: Blindly Drop the Database
        // ---------------------------------------------------------
        // We don't care if the Tenant Record exists or not.
        // We assume the DB name is 'tenant' + ID (default behavior).
        // If your prefix is different in config/tenancy.php, update this!
        $dbName = 'tenant' . $data['id'];

        // This SQL command works for Postgres to forcibly kill the DB
        try {
            // For Postgres, we might need to kill active connections first
            // (Optional, usually DROP works if no one is connected)
             DB::statement("DROP DATABASE IF EXISTS \"$dbName\"");
             $this->command->warn("  - Forced drop of database: $dbName");
        } catch (\Exception $e) {
            $this->command->warn("  - Could not drop DB (might not exist): " . $e->getMessage());
        }

        // ---------------------------------------------------------
        // 2. Cleanup Tenant Record (if it exists)
        // ---------------------------------------------------------
        if ($tenant = Tenant::find($data['id'])) {
            $tenant->delete();
        }

        // ---------------------------------------------------------
        // 3. Create Fresh Tenant
        // ---------------------------------------------------------
        $tenant = Tenant::create([
            'id' => $data['id'],
        ]);

        $tenant->domains()->create([
            'domain' => $data['id'] . '.localhost',
        ]);

        // ---------------------------------------------------------
        // 4. Create & Migrate Database
        // ---------------------------------------------------------
        $this->command->info("  - Creating Database...");

        // We wrap this in try-catch just in case the Event Listener already created it
        try {
            dispatch_sync(new CreateDatabase($tenant));
        } catch (\Exception $e) {
            // Ignore "Already Exists" errors if the listener handled it
        }

        $this->command->info("  - Migrating Database...");
        dispatch_sync(new MigrateDatabase($tenant));

        // ---------------------------------------------------------
        // 5. Seed Data
        // ---------------------------------------------------------
        $this->command->info("  - Seeding Tenant Data...");
        $tenant->run(function () {
            $this->call(TenantRolesSeeder::class);
            $this->call(TenantUsersSeeder::class);
        });

        $this->command->info("✅ Done with " . $data['name']);
        $this->command->newLine();
    }
}
