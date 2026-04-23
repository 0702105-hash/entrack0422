<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use App\Models\ModelMetric;

class ModelMetricController extends Controller
{
    public function show(int $id): JsonResponse
    {
        $modelMetric = ModelMetric::firstWhere('metric_id', $id);
        if (!$modelMetric)
            {
                return response()->json(['message' => 'Model Metric not found!'], 404);
            }
        return response()->json($modelMetric);
    }
    
}
