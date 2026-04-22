<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use App\Models\Prediction;

class PredictionController extends Controller
{
    public function show(int $id): JsonResponse
    {
        $prediction = Prediction::with('modelmlmodel')->firstWhere('predictions_id', $id);
        if (!$prediction)
            {
                return response()->json(['message' => 'Prediction not found!'], 404);
            }
        return response()->json($prediction);
    }
}
