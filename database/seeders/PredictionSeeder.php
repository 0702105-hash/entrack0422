<?php

namespace Database\Seeders;

use App\Support\SeederLookup;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PredictionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $randomEnrollment = SeederLookup::getRandomEnrollment();
        $randomModel = SeederLookup::getRandomMLModel();
        DB::table('predictions')->insert([
            'enrollment_id'=>$randomEnrollment->enrollment_id,
            'predicted_total'=>fake()->numberBetween(1,1000),
            'predicted_male'=>fake()->numberBetween(1,1000),
            'predicted_female'=>fake()->numberBetween(1, 1000),
            'confidence'=>fake()->randomFloat(2, 40, 100),
            'mlmodel_id'=>$randomModel->mlmodel_id,
        ]);
    }
}
