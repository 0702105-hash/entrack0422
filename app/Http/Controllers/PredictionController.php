<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PredictionController extends Controller
{
    /**
    FOR PREDICTION PAGE!
     */
    public function index(Request $request)
    {
        $selectedModel = $request->input('model', 'Ensemble');
        $models = DB::table('mlmodels')->pluck('mlmodel_name')->toArray();
        $programs = DB::table('programs')->get();

        $programTrends = [];
        foreach ($programs as $prog) {
            $programTrends[] = [
                'program_id' => $prog->program_id,
                'program_name' => $prog->program_name,
                'trend' => $this->buildTimelineData($prog->program_id, $selectedModel),
            ];
        }

        return Inertia::render('Predictions', [
            'filters' => ['model' => $selectedModel],
            'models' => $models,
            'programs' => $programs,
            'mainTrend' => $this->buildTimelineData(null, $selectedModel),
            'predictionTrends' => $programTrends,
        ]);
    }

    private function buildTimelineData($programId, $modelName): array
    {
        $histQuery = DB::table('enrollments as e')
            ->join('programs as p', 'p.program_id', '=', 'e.program_id')
            ->select(
                'e.academic_year_start as year_start',
                'e.academic_year_end   as year_end',
                DB::raw('SUM(e.male + e.female) as total')
            )
            ->groupBy('e.academic_year_start', 'e.academic_year_end');

        if ($programId)
            $histQuery->where('e.program_id', $programId);
        $historical = $histQuery->orderBy('e.academic_year_start')->get();

        $predQuery = DB::table('predictions')
            ->join('enrollment_batches', 'predictions.enrollment_batch_id', '=', 'enrollment_batches.enrollment_batch_id')
            ->join('mlmodels', 'predictions.mlmodel_id', '=', 'mlmodels.mlmodel_id')
            ->select(
                'enrollment_batches.selected_year_start as year_start',
                'enrollment_batches.selected_year_end   as year_end',
                DB::raw('SUM(predictions.predicted_total) as total')
            )
            ->where('mlmodels.mlmodel_name', $modelName)
            ->groupBy('enrollment_batches.selected_year_start', 'enrollment_batches.selected_year_end');

        if ($programId)
            $predQuery->where('enrollment_batches.program_id', $programId);
        $predictions = $predQuery->orderBy('enrollment_batches.selected_year_start')->get();

        $trendMap = [];

        foreach ($historical as $row) {
            if (!$row->year_start)
                continue;
            $period = 'AY ' . substr($row->year_start, -2) . '-' . substr($row->year_end, -2);
            $trendMap[$row->year_start] = [
                'period' => $period,
                'baseline' => (int) $row->total,
                'predicted' => null,
                'sort_key' => (int) $row->year_start,
            ];
        }

        // Anchor: carry last historical value into predicted so the lines connect
        $lastKey = empty($trendMap) ? null : max(array_keys($trendMap));
        if ($lastKey) {
            $trendMap[$lastKey]['predicted'] = $trendMap[$lastKey]['baseline'];
        }

        foreach ($predictions as $row) {
            $period = 'AY ' . substr($row->year_start, -2) . '-' . substr($row->year_end, -2);
            if (!isset($trendMap[$row->year_start])) {
                $trendMap[$row->year_start] = [
                    'period' => $period,
                    'baseline' => null,
                    'predicted' => (int) $row->total,
                    'sort_key' => (int) $row->year_start,
                ];
            } else {
                $trendMap[$row->year_start]['predicted'] = (int) $row->total;
            }
        }

        ksort($trendMap);

        return array_values(array_map(function ($item) {
            unset($item['sort_key']);
            return $item;
        }, $trendMap));
    }
}