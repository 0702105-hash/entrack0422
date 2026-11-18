<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PredictionController extends Controller
{
    private const RECENT_DAYS = [
        'day' => 1,
        'week' => 7,
        'month' => 30,
        'year' => 365,
    ];

    public function index(Request $request)
    {
        $selectedModel = $request->input('model', 'Ensemble');
        $models = DB::table('mlmodels')->pluck('mlmodel_name')->toArray();
        $programs = DB::table('programs')->get();

        $recent = $request->input('recent', 'all');
        $selectedProgramId = $request->input('program_id') ?: null;

        return Inertia::render('Predictions', [
            'filters' => ['model' => $selectedModel],
            'models' => $models,
            'programs' => $programs,
            'mainTrend' => $this->buildTimelineData($selectedProgramId, $selectedModel),
            'recentPredictions' => $this->buildRecentResults($recent),
            'recentFilter' => $recent,
        ]);
    }

    /**
     * One row per program+year batch that has at least one prediction,
     * most recent first. Shows the average across whichever of
     * LSTM/XGBoost/Ensemble actually have a prediction for that batch (not
     * a hardcoded /3), plus the individual per-model numbers for the
     * "view breakdown" modal on the Predictions page.
     */
    private function buildRecentResults(string $recent): array
    {
        $query = DB::table('predictions as p')
            ->join('enrollment_batches as eb', 'eb.enrollment_batch_id', '=', 'p.enrollment_batch_id')
            ->join('programs as prog', 'prog.program_id', '=', 'eb.program_id')
            ->join('mlmodels as m', 'm.mlmodel_id', '=', 'p.mlmodel_id');

        if (array_key_exists($recent, self::RECENT_DAYS)) {
            $query->where('p.created_at', '>=', now()->subDays(self::RECENT_DAYS[$recent]));
        }

        $rows = $query
            ->select(
                'eb.enrollment_batch_id',
                'prog.program_id',
                'prog.program_name',
                'eb.selected_year_start',
                'eb.selected_year_end',
                'm.mlmodel_name',
                'p.predicted_total',
                'p.predicted_male',
                'p.predicted_female',
                'p.confidence',
                'p.created_at'
            )
            ->orderByDesc('p.created_at')
            ->get()
            ->groupBy('enrollment_batch_id');

        return $rows->map(function ($modelRows) {
            $first = $modelRows->first();

            $breakdown = $modelRows->map(fn ($r) => [
                'model' => $r->mlmodel_name,
                'total' => (int) $r->predicted_total,
                'male' => (int) $r->predicted_male,
                'female' => (int) $r->predicted_female,
                'confidence' => round((float) $r->confidence * 100, 1),
            ])->values();

            return [
                'enrollment_batch_id' => $first->enrollment_batch_id,
                'program_id' => $first->program_id,
                'program_name' => $first->program_name,
                'academic_year' => $first->selected_year_start . '-' . $first->selected_year_end,
                'average' => (int) round($modelRows->avg('predicted_total')),
                'average_male' => (int) round($modelRows->avg('predicted_male')),
                'average_female' => (int) round($modelRows->avg('predicted_female')),
                'generated_at' => $modelRows->max('created_at'),
                'breakdown' => $breakdown,
            ];
        })
        ->sortByDesc('generated_at')
        ->values()
        ->toArray();
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