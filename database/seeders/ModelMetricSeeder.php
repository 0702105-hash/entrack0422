<?php

namespace Database\Seeders;

use App\Support\SeederLookup;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ModelMetricSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $randomPrediction = SeederLookup::getRandomPrediction();
        DB::table('model_metrics')->insert([
            'predictions_id' => $randomPrediction->predictions_id,
            'mae_value' => fake()->randomFloat(2, 50, 100),
            'rmse_value' => fake()->randomFloat(2, 50, 100),
            'mape_value' => fake()->randomFloat(2, 50, 100),
            'rsquared_value' => fake()->randomFloat(2, 50, 100),
        ]);
    }
}
