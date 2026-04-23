<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use App\Models\MLModel;

class MLModelController extends Controller
{
    public function show(int $id): JsonResponse
    {
        $mlmodel = MLModel::with('predictions.model')->firstWhere('mlmodel_id', $id);
        if (!$mlmodel)
            {
                return response()->json(['message' => 'ML Model not found'], 404);
            }
        return response()->json($mlmodel);
    }
}
