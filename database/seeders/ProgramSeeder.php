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
            'program_name' => 'BACHELOR OF ARTS IN COMMUNICATION',
            'department_id' => 1
        ]);
        DB::table('programs')->insert([
            'program_name' => 'BACHELOR OF ARTS IN ENGLISH LANGUAGE',
            'department_id' => 1
        ]);
        DB::table('programs')->insert([
            'program_name' => 'BACHELOR OF ARTS IN POLITICAL SCIENCE',
            'department_id' => 1
        ]);
        DB::table('programs')->insert([
            'program_name' => 'BACHELOR OF LIBRARY AND INFORMATION SCIENCE',
            'department_id' => 1
        ]);
        DB::table('programs')->insert([
            'program_name' => 'BACHELOR OF MUSIC IN MUSIC EDUCATION',
            'department_id' => 1
        ]);
        DB::table('programs')->insert([
            'program_name' => 'BACHELOR OF SCIENCE IN BIOLOGY',
            'department_id' => 1
        ]);
        DB::table('programs')->insert([
            'program_name' => 'BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY',
            'department_id' => 1
        ]);
        DB::table('programs')->insert([
            'program_name' => 'BACHELOR OF SCIENCE IN SOCIAL WORK',
            'department_id' => 1
        ]);

    }
}
