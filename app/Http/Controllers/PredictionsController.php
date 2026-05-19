<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PredictionsController extends Controller
{
    //
}



/*class ProgramsController extends Controller
{
    public function index(Request $request): Response
    {
        // 1. Get user filters (or set defaults)
        $selectedModel = $request->input('model', 'Ensemble');
        $selectedSemesters = (int) $request->input('semesters', 3);

        // 2. Fetch all available models from DB to populate the dropdown
        $models = DB::table('mlmodels')->pluck('mlmodel_name')->toArray();
        if (empty($models)) {
            $models = ['Ensemble', 'Prophet', 'LSTM', 'XGBoost'];
        }

        // --- FETCH MAIN AGGREGATE TREND ---
        $mainTrend = $this->buildTimelineData(null, $selectedModel, $selectedSemesters);

        // --- FETCH PROGRAM-SPECIFIC TRENDS ---
        $programs = DB::table('programs')->get();
        $programTrends = [];

        foreach ($programs as $prog) {
            $programTrends[] = [
                'program_id' => $prog->program_id,
                'program_name' => $prog->program_name,
                'trend' => $this->buildTimelineData($prog->program_id, $selectedModel, $selectedSemesters)
            ];
        }

        return Inertia::render('Programs', [
            'filters' => [
                'model' => $selectedModel,
                'semesters' => $selectedSemesters,
            ],
            'models' => $models,
            'mainTrend' => $mainTrend,
            'programTrends' => $programTrends,
        ]);
    }

    private function buildTimelineData($programId, $modelName, $semesterLimit)
    {
        $histQuery = DB::table('enrollments')
            ->select(
                'academic_year_start as year_start',
                'academic_year_end as year_end',
                DB::raw('SUM(male + female) as total')
            )
            ->groupBy('year_start', 'year_end')
            ->orderBy('year_start');

        if ($programId) {
            $histQuery->where('program_id', $programId);
        }
        $historical = $histQuery->get();

        $predQuery = DB::table('predictions')
            ->join('enrollment_batches', 'predictions.enrollment_batch_id', '=', 'enrollment_batches.enrollment_batch_id')
            ->join('mlmodels', 'predictions.mlmodel_id', '=', 'mlmodels.mlmodel_id')
            ->where('mlmodels.mlmodel_name', $modelName)
            ->select(
                'enrollment_batches.selected_year_start as year_start',
                'enrollment_batches.selected_year_end as year_end',
                DB::raw('SUM(predictions.predicted_total) as total')
            )
            ->groupBy('year_start', 'year_end')
            ->orderBy('year_start')
            ->limit(ceil($semesterLimit / 3));

        if ($programId) {
            $predQuery->where('enrollment_batches.program_id', $programId);
        }
        $predictions = $predQuery->get();

        $trendMap = [];

        foreach ($historical as $row) {
            $period = substr($row->year_start, 2) . '-' . substr($row->year_end, 2);
            $trendMap[$period] = [
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

        return array_values(array_map(function ($item) {
            unset($item['sort_key']);
            return $item;
        }, $trendMap));
    }
}*/