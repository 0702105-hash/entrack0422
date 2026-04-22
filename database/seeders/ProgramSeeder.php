<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Support\SeederLookup;

class ProgramSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('programs')->insert([
            'program_name' => 'Bachelor of Arts in Test',
            'department_id' => SeederLookup::getRandomDepartment()->department_id,
        ]);
    }
}
