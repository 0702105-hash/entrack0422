<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\EnrollmentBatch;
use App\Models\Enrollment;


class EnrollmentPivotSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $enrollments = Enrollment::all();
        $batches = EnrollmentBatch::all();

        foreach ($enrollments as $enrollment)
            {
                $randomBatches = $batches->random(rand(1, 3))->pluck('enrollment_batch_id');
                $enrollment->enrollmentBatches()->attach($randomBatches);
            }
    }
}
