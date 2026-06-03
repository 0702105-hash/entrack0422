<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\Process\Process;

class PredictionRetrainController extends Controller
{
    public function retrain(Request $request): JsonResponse
    {
        $data = $request->validate([
            'base_year' => ['required', 'integer'],
            'future_years' => ['nullable', 'integer'],
        ]);

        $baseYear = (int) $data['base_year'];
        $futureYears = (int) ($data['future_years'] ?? 1);

        $process = new Process([
            PHP_BINARY,
            'artisan',
            'ml:retrain',
            '--base-year=' . $baseYear,
            '--future-years=' . $futureYears,
        ], base_path());

        $process->setTimeout(60 * 30);
        $process->run();

        if (!$process->isSuccessful()) {
            return response()->json([
                'message' => 'Retrain failed',
                'error' => $process->getErrorOutput(),
                'output' => $process->getOutput(),
            ], 500);
        }

        return response()->json([
            'message' => 'Retrain completed',
            'output' => $process->getOutput(),
        ]);
    }
}