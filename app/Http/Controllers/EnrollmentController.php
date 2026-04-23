<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Enrollment;

class EnrollmentController extends Controller
{
    public function show(int $id): JsonResponse
    {
        $enrollment = Enrollment::with('enrollmentPivots.enrollmentBatches')->firstWhere('enrollment_id', $id);
        if (!$enrollment) 
            {
                return response()->json(['message' => 'Enrollment not found.'], 404);
            }
        return response()->json($enrollment);
    }
}
