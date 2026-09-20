<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * This used to insert a user with Str::random(10) for BOTH the
     * username and email, every single time this seeder ran -- meaning
     * every `migrate:fresh --seed` created a login with credentials
     * nobody could ever know, since they were never printed or recorded
     * anywhere. This is almost certainly why login stopped working after
     * re-seeding. Fixed to a documented, fixed login.
     */
    public function run(): void
    {
        DB::table('users')->updateOrInsert(
            ['email' => 'admin@entrack.local'],
            [
                'username' => 'admin',
                'email' => 'admin@entrack.local',
                'password' => Hash::make('password'),
            ]
        );

        $this->command?->info('Seeded login -> email: admin@entrack.local | password: password');
    }
}
