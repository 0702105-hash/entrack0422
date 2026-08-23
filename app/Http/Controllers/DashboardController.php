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
        // 1. Summary Totals
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

        // 2. Program Distribution
        $programDistributionQuery = DB::table('predictions')
            ->join('enrollment_batches', 'predictions.enrollment_batch_id', '=', 'enrollment_batches.enrollment_batch_id')
            ->join('programs', 'enrollment_batches.program_id', '=', 'programs.program_id')
            ->select('programs.program_name as name', DB::raw('SUM(predictions.predicted_total) as value'))
            ->groupBy('programs.program_id', 'programs.program_name')
            ->get();

        $programDistribution = $programDistributionQuery->map(function ($item) {
            return [
                'name' => $item->name,
                'value' => (int) $item->value,
            ];
        })->values()->toArray();

        // 3. Historical Baseline
        $historicalQuery = DB::table('programs as p')
            ->join('enrollments as e', 'p.program_id', '=', 'e.program_id')
            ->select(
                'e.academic_year_start as year_start',
                'e.academic_year_end as year_end',
                DB::raw('SUM(e.male + e.female) as total')
            )
            ->groupBy('e.academic_year_start', 'e.academic_year_end')
            ->get();

        // 4. Future Predictions 
        $predictionsQuery = DB::table('predictions')
            ->join('enrollment_batches', 'predictions.enrollment_batch_id', '=', 'enrollment_batches.enrollment_batch_id')
            ->select(
                'enrollment_batches.selected_year_start as year_start',
                'enrollment_batches.selected_year_end as year_end',
                DB::raw('SUM(predictions.predicted_total) as total')
            )
            ->groupBy('enrollment_batches.selected_year_start', 'enrollment_batches.selected_year_end')
            ->get();

        $trendMap = [];

        // Build Historical
        foreach ($historicalQuery as $row) {
            $period = $row->year_start . '-' . $row->year_end;
            $trendMap[$period] = [
                'period' => $period,
                'baseline' => (int) $row->total,
                'predicted' => null,
                'sort_key' => $row->year_start
            ];
        }

        // Anchor bridge
        $latestPeriod = null;
        $latestYear = 0;
        foreach ($trendMap as $p => $data) {
            if ($data['sort_key'] > $latestYear) {
                $latestYear = $data['sort_key'];
                $latestPeriod = $p;
            }
        }
        if ($latestPeriod) {
            $trendMap[$latestPeriod]['predicted'] = $trendMap[$latestPeriod]['baseline'];
        }

        // Build Predictions
        foreach ($predictionsQuery as $row) {
            $period = $row->year_start . '-' . $row->year_end;
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

        // Sort chronologically
        usort($trendMap, fn($a, $b) => $a['sort_key'] <=> $b['sort_key']);
        
        // Format for React
        $trendData = [];
        foreach ($trendMap as $item) {
            unset($item['sort_key']);
            $trendData[] = $item;
        }

        return Inertia::render('Dashboard', [
            'summary' => $summary,
            'programDistribution' => $programDistribution,
            'trendData' => $trendData
        ]);
    }
}