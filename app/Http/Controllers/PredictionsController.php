<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PredictionsController extends Controller
{
    public function index(Request $request): Response
    {
        $selectedModel = $request->input('model', 'Xgboost');
        
        $models = DB::table('mlmodels')->pluck('mlmodel_name')->toArray();
        $programs = DB::table('programs')->get();
        
        $programTrends = [];

        foreach ($programs as $prog) {
            $trend = $this->buildTimelineData($prog->program_id, $selectedModel);
            
            // FIX: We no longer check count($trend) > 0 so that we can see 
            // empty charts if data is missing, helping you debug what's empty.
            $programTrends[] = [
                'program_id' => $prog->program_id,
                'program_name' => $prog->program_name,
                'trend' => $trend
            ];
        }

        return Inertia::render('Predictions', [
            'filters' => ['model' => $selectedModel],
            'models' => $models,
            'programs' => $programs,
            'mainTrend' => $this->buildTimelineData(null, $selectedModel),
            'predictionTrends' => $programTrends, // This matches your Predictions.tsx prop
        ]);
    }

    private function buildTimelineData($programId, $modelName)
    {
        $histQuery = DB::table('programs as p')
            ->leftJoin('enrollments as e', 'p.program_id', '=', 'e.program_id')
            ->select('e.academic_year_start as year_start', 'e.academic_year_end as year_end', DB::raw('SUM(e.male + e.female) as total'))
            ->groupBy('e.academic_year_start', 'e.academic_year_end');

        if ($programId) $histQuery->where('p.program_id', $programId);
        $historical = $histQuery->get();

        $predQuery = DB::table('predictions')
            ->join('enrollment_batches', 'predictions.enrollment_batch_id', '=', 'enrollment_batches.enrollment_batch_id')
            ->join('mlmodels', 'predictions.mlmodel_id', '=', 'mlmodels.mlmodel_id')
            ->select('enrollment_batches.selected_year_start as year_start', 'enrollment_batches.selected_year_end as year_end', DB::raw('SUM(predictions.predicted_total) as total'))
            ->where('mlmodels.mlmodel_name', 'LIKE', $modelName . '%')
            ->groupBy('enrollment_batches.selected_year_start', 'enrollment_batches.selected_year_end');

        if ($programId) $predQuery->where('enrollment_batches.program_id', $programId);
        $predictions = $predQuery->get();

        $trendMap = [];
        foreach ($historical as $row) {
            if (!$row->year_start) continue;
            $period = 'AY ' . substr($row->year_start, 2) . '-' . substr($row->year_end, 2);
            $trendMap[$row->year_start] = ['period' => $period, 'baseline' => (int)$row->total, 'predicted' => (int)$row->total, 'sort_key' => $row->year_start];
        }

        foreach ($predictions as $row) {
            $period = 'AY ' . substr($row->year_start, 2) . '-' . substr($row->year_end, 2);
            if (!isset($trendMap[$row->year_start])) {
                $trendMap[$row->year_start] = ['period' => $period, 'baseline' => null, 'predicted' => (int)$row->total, 'sort_key' => $row->year_start];
            } else {
                $trendMap[$row->year_start]['predicted'] = (int)$row->total;
            }
        }

        ksort($trendMap);
        return array_values($trendMap);
    }
}