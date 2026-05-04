<?php

namespace App\Http\Controllers;

use App\Models\MLModel;
use App\Models\ModelMetric;
use App\Models\Prediction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class PredictionRunController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'enrollment_batch_id' => ['required', 'integer'],
            'model_name' => ['nullable', 'string'],
        ]);

        $payload = [
            'enrollment_batch_id' => $data['enrollment_batch_id'],
            'model_name' => $data['model_name'] ?? 'ensemble',
        ];

        $baseUrl = config('services.ml_service.base_url');
        $response = Http::timeout(60)->post($baseUrl . '/predict', $payload);

        if (!$response->successful()) {
            return response()->json([
                'message' => 'Prediction service failed',
                'status' => $response->status(),
                'response' => $response->json(),
            ], 502);
        }

        $result = $response->json();

        $prediction = DB::transaction(function () use ($payload, $result) {
            $model = MLModel::firstOrCreate(['mlmodel_name' => $result['model_name']]);

            $prediction = Prediction::create([
                'enrollment_batch_id' => $payload['enrollment_batch_id'],
                'predicted_total' => $result['predicted_total'],
                'predicted_male' => $result['predicted_male'],
                'predicted_female' => $result['predicted_female'],
                'confidence' => $result['confidence'],
                'mlmodel_id' => $model->mlmodel_id,
            ]);

            ModelMetric::create([
                'predictions_id' => $prediction->predictions_id,
                'mae_value' => $result['metrics']['mae_value'],
                'rmse_value' => $result['metrics']['rmse_value'],
                'mape_value' => $result['metrics']['mape_value'],
                'rsquared_value' => $result['metrics']['rsquared_value'],
            ]);

            return $prediction->load(['mlmodel', 'modelMetrics']);
        });

        return response()->json([
            'message' => 'Prediction stored',
            'data' => $prediction,
        ]);
    }
}