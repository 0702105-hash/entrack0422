<?php

namespace Database\Seeders;

use App\Enums\SemesterEnums;
use Illuminate\Database\Seeder;
use App\Support\SeederLookup;
use Illuminate\Support\Facades\DB;

class EnrollmentBatchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $randomProgram= SeederLookup::getRandomProgram();
        DB::table('enrollment_batches')->insert([
            'program_id' => $randomProgram->program_id,
            'selected_year_start' => fake()->numberBetween(2013, 2015),
            'selected_year_end' => fake()->numberBetween(2016, 2020),
            'selected_semester' =>fake()->randomElement(SemesterEnums::cases())->value,
            'total_male' => fake()->numberBetween(100, 1000),
            'total_female' => fake()->numberBetween(100, 1000),
        ]);
    }
}
