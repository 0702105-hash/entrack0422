<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use App\Models\EnrollmentBatch;

class EnrollmentBatchController extends Controller
{

    public function show(int $id): JsonResponse
    {
        $enrollmentBatch = EnrollmentBatch::with('enrollmentPivots.enrollments')->firstWhere('enrollment_batch_id', $id);
        if (!$enrollmentBatch)
            {
                return response()->json(['message' => 'Enrollment Batch not found!'], 404);
            }
        return response()->json($enrollmentBatch);
    }
}
