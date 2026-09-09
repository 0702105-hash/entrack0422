<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    private const PERIOD_DAYS = [
        'daily' => 1,
        'weekly' => 7,
        'monthly' => 30,
        'yearly' => 365,
    ];

    public function index(Request $request): Response
    {
        $period = $request->input('period', 'yearly');
        if (!array_key_exists($period, self::PERIOD_DAYS)) {
            $period = 'yearly';
        }
        $sinceDate = now()->subDays(self::PERIOD_DAYS[$period]);

        // Every query below used to sum predicted_total/predicted_male/
        // predicted_female straight across ALL rows for a batch -- so once
        // more than one model's predictions existed for the same
        // program/year (the normal case), every number here was inflated by
        // up to 3x. This averages per batch first (one row per
        // program+year, across whichever models actually have a prediction
        // for it), THEN sums/aggregates those per-batch averages -- matching
        // "average of LSTM/XGBoost/Ensemble" used elsewhere in the app,
        // instead of picking one model to stand in for the rest.
        $batchAverages = DB::table('predictions as p')
            ->join('enrollment_batches as eb', 'eb.enrollment_batch_id', '=', 'p.enrollment_batch_id')
            ->where('p.created_at', '>=', $sinceDate)
            ->select(
                'eb.enrollment_batch_id',
                'eb.program_id',
                'eb.selected_year_start',
                'eb.selected_year_end',
                DB::raw('AVG(p.predicted_total) as avg_total'),
                DB::raw('AVG(p.predicted_male) as avg_male'),
                DB::raw('AVG(p.predicted_female) as avg_female'),
                DB::raw('AVG(p.confidence) as avg_confidence'),
                DB::raw('MAX(p.created_at) as last_generated_at')
            )
            ->groupBy('eb.enrollment_batch_id', 'eb.program_id', 'eb.selected_year_start', 'eb.selected_year_end')
            ->get();

        $summary = [
            'total_predicted' => (int) round($batchAverages->sum('avg_total')),
            'total_male' => (int) round($batchAverages->sum('avg_male')),
            'total_female' => (int) round($batchAverages->sum('avg_female')),
            'avg_confidence' => $batchAverages->isEmpty()
                ? 0.0
                : round((float) $batchAverages->avg('avg_confidence') * 100, 2),
            'batches_counted' => $batchAverages->count(),
        ];

        // Program Distribution -- same per-batch-average fix.
        $programNames = DB::table('programs')->pluck('program_name', 'program_id');
        $programDistribution = $batchAverages
            ->groupBy('program_id')
            ->map(function ($rows, $programId) use ($programNames) {
                return [
                    'name' => $programNames->get($programId, "Program {$programId}"),
                    'value' => (int) round($rows->sum('avg_total')),
                ];
            })
            ->values()
            ->sortByDesc('value')
            ->values()
            ->toArray();

        // Enrollment Trend -- NOT filtered by the recency period above; this
        // is a multi-year academic timeline (historical vs predicted), and
        // filtering it by when a prediction was generated would arbitrarily
        // cut years out rather than show the actual forecast horizon.
        $historicalQuery = DB::table('enrollments')
            ->select(
                'academic_year_start as year_start',
                'academic_year_end as year_end',
                DB::raw('SUM(male) as male'),
                DB::raw('SUM(female) as female'),
                DB::raw('SUM(male + female) as total')
            )
            ->groupBy('academic_year_start', 'academic_year_end')
            ->get();

        $predictionsByYear = DB::table('predictions as p')
            ->join('enrollment_batches as eb', 'eb.enrollment_batch_id', '=', 'p.enrollment_batch_id')
            ->select(
                'eb.enrollment_batch_id',
                'eb.selected_year_start as year_start',
                'eb.selected_year_end as year_end',
                DB::raw('AVG(p.predicted_total) as avg_total'),
                DB::raw('AVG(p.predicted_male) as avg_male'),
                DB::raw('AVG(p.predicted_female) as avg_female')
            )
            ->groupBy('eb.enrollment_batch_id', 'eb.selected_year_start', 'eb.selected_year_end')
            ->get()
            ->groupBy('year_start')
            ->map(function ($rows) {
                return [
                    'total' => $rows->sum('avg_total'),
                    'male' => $rows->sum('avg_male'),
                    'female' => $rows->sum('avg_female'),
                ];
            });

        $trendMap = [];

        foreach ($historicalQuery as $row) {
            $period_key = $row->year_start . '-' . $row->year_end;
            $trendMap[$period_key] = [
                'period' => $period_key,
                'baseline' => (int) $row->total,
                'baseline_male' => (int) $row->male,
                'baseline_female' => (int) $row->female,
                'predicted' => null,
                'predicted_male' => null,
                'predicted_female' => null,
                'sort_key' => (int) $row->year_start,
            ];
        }

        // Anchor: carry the last historical value into predicted so the
        // lines visually connect instead of leaving a gap.
        $latestPeriod = null;
        $latestYear = -INF;
        foreach ($trendMap as $p => $data) {
            if ($data['sort_key'] > $latestYear) {
                $latestYear = $data['sort_key'];
                $latestPeriod = $p;
            }
        }
        if ($latestPeriod) {
            $trendMap[$latestPeriod]['predicted'] = $trendMap[$latestPeriod]['baseline'];
            $trendMap[$latestPeriod]['predicted_male'] = $trendMap[$latestPeriod]['baseline_male'];
            $trendMap[$latestPeriod]['predicted_female'] = $trendMap[$latestPeriod]['baseline_female'];
        }

        foreach ($predictionsByYear as $yearStart => $vals) {
            // Reconstruct year_end from any matching batch row (all batches
            // for the same year_start share the same year_end convention).
            $yearEnd = $yearStart + 1;
            $period_key = $yearStart . '-' . $yearEnd;

            if (!isset($trendMap[$period_key])) {
                $trendMap[$period_key] = [
                    'period' => $period_key,
                    'baseline' => null,
                    'baseline_male' => null,
                    'baseline_female' => null,
                    'predicted' => null,
                    'predicted_male' => null,
                    'predicted_female' => null,
                    'sort_key' => (int) $yearStart,
                ];
            }

            $trendMap[$period_key]['predicted'] = (int) round($vals['total']);
            $trendMap[$period_key]['predicted_male'] = (int) round($vals['male']);
            $trendMap[$period_key]['predicted_female'] = (int) round($vals['female']);
        }

        usort($trendMap, fn ($a, $b) => $a['sort_key'] <=> $b['sort_key']);

        $trendData = array_map(function ($item) {
            unset($item['sort_key']);
            return $item;
        }, $trendMap);

        return Inertia::render('Dashboard', [
            'summary' => $summary,
            'programDistribution' => $programDistribution,
            'trendData' => array_values($trendData),
            'period' => $period,
        ]);
    }
}
