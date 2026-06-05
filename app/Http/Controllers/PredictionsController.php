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
        $selectedModel = $request->input('model', 'Xgboost'); // Default model
        
        $models = DB::table('mlmodels')->pluck('mlmodel_name')->toArray();
        if (empty($models)) {
            $models = ['Ensemble', 'Lstm', 'Xgboost'];
        }

        $programs = DB::table('programs')->get();
        $programTrends = [];

        // Build individual program graph arrays
        foreach ($programs as $prog) {
            $programTrends[] = [
                'program_id' => $prog->program_id,
                'program_name' => $prog->program_name,
                'trend' => $this->buildTimelineData($prog->program_id, $selectedModel)
            ];
        }

        // Build aggregate graph
        $mainTrend = $this->buildTimelineData(null, $selectedModel);

        return Inertia::render('Predictions', [
            'filters' => [
                'model' => $selectedModel,
            ],
            'models' => $models,
            'mainTrend' => $mainTrend,
            'programTrends' => $programTrends,
        ]);
    }

    private function buildTimelineData($programId, $modelName)
    {
        // THE FIX: Correctly JOIN programs and enrollments
        $histQuery = DB::table('programs as p')
            ->join('enrollments as e', 'p.program_id', '=', 'e.program_id')
            ->select(
                'e.academic_year_start as year_start',
                'e.academic_year_end as year_end',
                DB::raw('SUM(e.male + e.female) as total')
            )
            ->groupBy('e.academic_year_start', 'e.academic_year_end');

        if ($programId) {
            $histQuery->where('p.program_id', $programId);
        }
        $historical = $histQuery->get();

        $predQuery = DB::table('predictions')
            ->join('enrollment_batches', 'predictions.enrollment_batch_id', '=', 'enrollment_batches.enrollment_batch_id')
            ->join('mlmodels', 'predictions.mlmodel_id', '=', 'mlmodels.mlmodel_id')
            ->select(
                'enrollment_batches.selected_year_start as year_start',
                'enrollment_batches.selected_year_end as year_end',
                DB::raw('SUM(predictions.predicted_total) as total')
            )
            ->where('mlmodels.mlmodel_name', 'LIKE', $modelName . '%')
            ->groupBy('enrollment_batches.selected_year_start', 'enrollment_batches.selected_year_end');

        if ($programId) {
            $predQuery->where('enrollment_batches.program_id', $programId);
        }
        $predictions = $predQuery->get();

        $trendMap = [];

        // Format for Recharts
        foreach ($historical as $row) {
            $period = substr($row->year_start, 2) . '-' . substr($row->year_end, 2);
            $trendMap['AY ' . $period] = [
                'period' => 'AY ' . $period,
                'baseline' => (int) $row->total,
                'predicted' => null,
                'sort_key' => $row->year_start
            ];
        }

        if (!empty($trendMap)) {
            $lastPeriod = array_key_last($trendMap);
            $trendMap[$lastPeriod]['predicted'] = $trendMap[$lastPeriod]['baseline'];
        }

        foreach ($predictions as $row) {
            $period = substr($row->year_start, 2) . '-' . substr($row->year_end, 2);
            if (!isset($trendMap['AY ' . $period])) {
                $trendMap['AY ' . $period] = [
                    'period' => 'AY ' . $period,
                    'baseline' => null,
                    'predicted' => (int) $row->total,
                    'sort_key' => $row->year_start
                ];
            } else {
                $trendMap['AY ' . $period]['predicted'] = (int) $row->total;
            }
        }

        usort($trendMap, fn($a, $b) => $a['sort_key'] <=> $b['sort_key']);
        
        return array_values(array_map(function($item) {
            unset($item['sort_key']);
            return $item;
        }, $trendMap));
    }
}