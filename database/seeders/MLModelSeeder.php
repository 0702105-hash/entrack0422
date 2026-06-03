<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
Use Illuminate\Support\Facades\DB;

class MLModelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('mlmodels')->insert([
            'mlmodel_name'=> 'LSTM',
        ]);
        DB::table('mlmodels')->insert([
            'mlmodel_name'=> 'Prophet',
        ]);
        DB::table('mlmodels')->insert([
            'mlmodel_name'=> 'XGBoost',
        ]);
        DB::table('mlmodels')->insert([
            'mlmodel_name'=> 'Ensemble',
        ]);
    }
}
