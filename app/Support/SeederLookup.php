<?php

namespace App\Support;

use App\Models\Department;
use App\Models\Enrollment;
use App\Models\EnrollmentBatch;
use App\Models\ModelMetric;
use App\Models\Program;
use App\Enums\SemesterEnums;
use App\Models\MLModel;
use App\Models\Prediction;
class SeederLookup {

    public static function getRandomDepartment() : Department
    {
        $randomDepartment = Department::inRandomOrder()->first();
        if (!$randomDepartment)
            {
                $randomDepartment = Department::firstOrCreate([
                    'department_name'=>'Bachelor of Science in New',
                ]);
            }
        return $randomDepartment;
    }
    public static function getRandomProgram() : Program
    {
        $randomProgram = Program::inRandomOrder()->first();
        if (!$randomProgram) 
            {
                $randomProgram = Program::firstOrCreate([
                    'department_id'=>SeederLookup::getRandomDepartment()->department_id,
                    'program_name'=> 'Bachelor of Science in Nescafe',
                ]);         
            }
        return $randomProgram;
    }

    public static function getRandomEnrollment() : Enrollment
    {
        $randomEnrollment = Enrollment::inRandomOrder()->first();
        if (!$randomEnrollment)
            {
                $randomProgram = SeederLookup::getRandomProgram();
                $randomEnrollment = Enrollment::firstOrCreate([
                    'program_id' => $randomProgram->program_id,
                    'academic_year' => '2021-2022',
                    'semester' => fake()->randomElement(SemesterEnums::cases())->value,
                    'male' => fake()->numberBetween(1,1000),
                    'female' => fake()->numberBetween(1, 1000),
                ]);
            }
        return $randomEnrollment;
    }

    public static function getRandomMLModel() 
    {
        $randomMLModel = MLModel::inRandomOrder()->first();
        if (!$randomMLModel) 
            {
                $randomMLModel = MLModel::firstOrCreate([
                    'mlmodel_name' => 'Kendall Jenner',
                ]);
            }
        return $randomMLModel;
    }

    public static function getRandomPrediction()
    {

        $randomPrediction = Prediction::inRandomOrder()->first();
        if (!$randomPrediction) 
            {
                $randomEnrollmentBatch = SeederLookup::getRandomEnrollmentBatch();
                $randomModel = SeederLookup::getRandomMLModel();
                $randomPrediction = Prediction::firstOrCreate([
                    'enrollment_batch_id'=>$randomEnrollmentBatch->enrollment_batch_id,
                    'predicted_total'=>fake()->numberBetween(1,1000),
                    'predicted_male'=>fake()->numberBetween(1,1000),
                    'predicted_female'=>fake()->numberBetween(1, 1000),
                    'confidence'=>fake()->randomFloat(2, 40, 100),
                    'mlmodel_id'=>$randomModel->mlmodel_id,
                ]);
            }
            return $randomPrediction;
    }

    public static function getRandomEnrollmentBatch(): EnrollmentBatch
    {
        $randomEnrollmentBatch = EnrollmentBatch::inRandomOrder()->first();
        if (!$randomEnrollmentBatch)
            {
                $randomProgram = SeederLookup::getRandomProgram();
                EnrollmentBatch::create([
                    'program_id' => $randomProgram->program_id,
                    'selected_year_start' => fake()->numberBetween(2013, 2015),
                    'selected_year_end' => fake()->numberBetween(2016, 2020),
                    'selected_semester' => fake()->randomElement(SemesterEnums::cases())->value,
                    'total_male' => fake()->numberBetween(100, 1000),
                    'total_female' => fake()->numberBetween(100, 1000),
                ]);
            }
            return $randomEnrollmentBatch;
    }

    public static function getRandomMetric(): ModelMetric
    {
        $randomMetric = ModelMetric::inRandomOrder()->first();
        if (!$randomMetric)
            {
                $randomPrediction = SeederLookup::getRandomPrediction();
                ModelMetric::create([
                    'predictions_id' => $randomPrediction->predictions_id,
                    'mae_value' => fake()->numberBetween(50, 100),
                    'rmse_value' => fake()->numberBetween(50, 100),
                    'mape_value' => fake()->numberBetween(50, 100),
                    'rsqaured_value' => fake()->numberBetween(50, 100),
                ]);
            }
        return $randomMetric;
    }
}