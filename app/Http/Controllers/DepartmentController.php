<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use App\Models\Department;
class DepartmentController extends Controller
{
    public function show(int $id): JsonResponse
    {
        $department = Department::with('programs.enrollments')->firstWhere('department_id', $id);

        if (!$department) 
            {
                return response()->json(['message' => 'Department not found.'], 404);
            }

            return response()->json($department);
    }
}
