<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB; // ✅ Don't forget this import
use Spatie\Permission\Models\Role;

class CentralUsersSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create the "Super Admin" with forced ID 1
        $superAdmin = User::firstOrCreate(
            ['email' => 'super@hive.test'],
            [
                'id' => 1,
                'name' => 'Hive Overlord',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        if ($superAdmin) {
            $superAdmin->guard_name = 'web';
            $superAdmin->assignRole('Super Admin');
        }

        // ---------------------------------------------------------
        // ✅ FIX: Reset the Postgres Sequence
        // This tells Postgres: "Look at the highest ID in the table (1),
        // and set the counter there so the next one is 2."
        // ---------------------------------------------------------
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));");
        }
        // ---------------------------------------------------------

        // 2. Create 50 Random "Staff" Users
        $staffRole = Role::firstOrCreate(['name' => 'Staff', 'guard_name' => 'web']);

        User::factory()
            ->count(50)
            ->create([
                'password' => Hash::make('password'),
                'is_active' => true,
            ])
            ->each(function ($user) use ($staffRole) {
                $user->guard_name = 'web';
                $user->assignRole($staffRole);
            });

        echo "✅ Seeded 1 Super Admin (ID: 1) and 50 Random Staff users.\n";
    }
}
