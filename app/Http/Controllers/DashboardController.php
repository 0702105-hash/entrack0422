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

        $programDistributionRows = DB::table('predictions')
            ->join('enrollment_batches', 'predictions.enrollment_batch_id', '=', 'enrollment_batches.enrollment_batch_id')
            ->join('enrollment_pivot', 'enrollment_batches.enrollment_batch_id', '=', 'enrollment_pivot.enrollment_batch_id')
            ->join('enrollments', 'enrollment_pivot.enrollment_id', '=', 'enrollments.enrollment_id')
            ->join('programs', 'enrollments.program_id', '=', 'programs.program_id')
            ->select(
                'programs.program_name as name',
                DB::raw('SUM(predictions.predicted_total) as value')
            )
            ->groupBy('programs.program_id', 'programs.program_name')
            ->orderByDesc('value')
            ->get();

        $programDistribution = $programDistributionRows->map(fn ($row) => [
            'name' => $row->name,
            'value' => (int) $row->value,
        ])->values();

        $trendRows = DB::table('predictions')
            ->select(
                'academic_year_start',
                DB::raw('SUM(predicted_total) as predicted_total'),
                DB::raw('AVG(predicted_total) as baseline_total')
            )
            ->groupBy('academic_year_start')
            ->orderBy('academic_year_start')
            ->get();

        $trendData = $trendRows->map(fn ($row) => [
            'period' => 'AY ' . $row->academic_year_start,
            'predicted' => (int) $row->predicted_total,
            'baseline' => (int) $row->baseline_total,
        ])->values();

        return Inertia::render('Dashboard', [
            'summary' => $summary,
            'programDistribution' => $programDistribution,
            'trendData' => $trendData,
        ]);
    }
}