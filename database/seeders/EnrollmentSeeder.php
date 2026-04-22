<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Enums\SemesterEnums;
use Illuminate\Support\Facades\DB;
use App\Support\SeederLookup;
class EnrollmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
   
    public function run(): void
    {
        $randomProgram = SeederLookup::getRandomProgram();

       DB::table('enrollments')->insert([
        'program_id' => $randomProgram->program_id,
        'academic_year_start' => '2022',
        'academic_year_end' => '2023',
        'semester' => fake()->randomElement(SemesterEnums::cases())->value,
        'male' => fake()->numberBetween(1,1000),
        'female' => fake()->numberBetween(1, 1000),
       ]);
    }
}
