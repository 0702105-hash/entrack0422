<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Program;

class ProgramController extends Controller
{
    public function show(int $id): JsonResponse
    {
        $program = Program::with('enrollments.predictions')->firstWere('program_id', $id);

        if (!$program)
            {
                return response()->json(['message' => 'Program not found'], 404);
            }

        return response()->json($program);
    }
}
