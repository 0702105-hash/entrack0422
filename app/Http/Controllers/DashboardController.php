<?php

namespace App\Http\Controllers;

use App\Models\Prediction;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        // 1. Fetch Summary Totals
        $summaryRow = Prediction::query()
            ->selectRaw('
                COALESCE(SUM(predicted_total), 0) as total_predicted,
                COALESCE(SUM(predicted_male), 0) as total_male,
                COALESCE(SUM(predicted_female), 0) as total_female,
                COALESCE(AVG(confidence), 0) as avg_confidence
            ')
            ->first();

        $summary = [
            'total_predicted' => (int) ($summaryRow->total_predicted ?? 0),
            'total_male' => (int) ($summaryRow->total_male ?? 0),
            'total_female' => (int) ($summaryRow->total_female ?? 0),
            'avg_confidence' => round((float) ($summaryRow->avg_confidence ?? 0), 2), 
        ];

        // 2. Program Distribution (Donut Chart)
        $programDistribution = DB::table('predictions')
            ->join('enrollment_batches', 'predictions.enrollment_batch_id', '=', 'enrollment_batches.enrollment_batch_id')
            ->join('programs', 'enrollment_batches.program_id', '=', 'programs.program_id')
            ->select('programs.program_name as name', DB::raw('SUM(predictions.predicted_total) as value'))
            ->groupBy('programs.program_id', 'programs.program_name')
            ->get();

        // 3. Historical Baseline (THE FIX: Using your exact JOIN!)
        $historical = DB::table('programs as p')
            ->join('enrollments as e', 'p.program_id', '=', 'e.program_id')
            ->select(
                'e.academic_year_start as year_start',
                'e.academic_year_end as year_end',
                DB::raw('SUM(e.male + e.female) as total')
            )
            ->groupBy('e.academic_year_start', 'e.academic_year_end')
            ->get();

        // 4. Future Predictions 
        $predictions = DB::table('predictions')
            ->join('enrollment_batches', 'predictions.enrollment_batch_id', '=', 'enrollment_batches.enrollment_batch_id')
            ->select(
                'enrollment_batches.selected_year_start as year_start',
                'enrollment_batches.selected_year_end as year_end',
                DB::raw('SUM(predictions.predicted_total) as total')
            )
            ->groupBy('enrollment_batches.selected_year_start', 'enrollment_batches.selected_year_end')
            ->get();

        $trendMap = [];

        foreach ($historical as $row) {
            $period = 'AY ' . $row->year_start . '-' . $row->year_end;
            $trendMap[$period] = [
                'period' => $period,
                'baseline' => (int) $row->total,
                'predicted' => null,
                'sort_key' => $row->year_start
            ];
        }

        // Bridge the gap
        if (!empty($trendMap)) {
            $lastPeriod = array_key_last($trendMap);
            $trendMap[$lastPeriod]['predicted'] = $trendMap[$lastPeriod]['baseline'];
        }

        foreach ($predictions as $row) {
            $period = 'AY ' . $row->year_start . '-' . $row->year_end;
            if (!isset($trendMap[$period])) {
                $trendMap[$period] = [
                    'period' => $period,
                    'baseline' => null,
                    'predicted' => (int) $row->total,
                    'sort_key' => $row->year_start
                ];
            } else {
                $trendMap[$period]['predicted'] = (int) $row->total;
            }
        }

        usort($trendMap, fn($a, $b) => $a['sort_key'] <=> $b['sort_key']);
        $trendData = array_map(function($item) {
            unset($item['sort_key']);
            return $item;
        }, $trendMap);

        return Inertia::render('Dashboard', [
            'summary' => $summary,
            'programDistribution' => $programDistribution,
            'trendData' => $trendData
        ]);
    }
}