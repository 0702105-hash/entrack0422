<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PredictionController extends Controller
{
    public function index(Request $request)
    {
        // 1. Fetch dropdown options
        $programs = DB::table('programs')->select('program_id', 'program_name')->get();
        $models = DB::table('mlmodels')->pluck('mlmodel_name')->toArray();
        $academicYears = DB::table('enrollment_batches')
            ->select(DB::raw("CONCAT(selected_year_start, '-', selected_year_end) as ay"))
            ->distinct()
            ->pluck('ay')
            ->toArray();

        // 2. Base Query: Join all tables
        $query = DB::table('predictions')
            ->join('enrollment_batches', 'predictions.enrollment_batch_id', '=', 'enrollment_batches.enrollment_batch_id')
            ->join('programs', 'enrollment_batches.program_id', '=', 'programs.program_id')
            ->join('mlmodels', 'predictions.mlmodel_id', '=', 'mlmodels.mlmodel_id')
            ->select(
                'programs.program_id',
                'programs.program_name',
                'mlmodels.mlmodel_name',
                'enrollment_batches.selected_year_start',
                'enrollment_batches.selected_year_end',
                'enrollment_batches.selected_semester',
                'predictions.predicted_total'
            )
            // Ensure semesters are ordered chronologically
            ->orderByRaw("FIELD(enrollment_batches.selected_semester, 'First', 'Second', 'Summer')");

        // 3. Apply Filters from the React Form
        if ($request->filled('program_id')) {
            $query->where('programs.program_id', $request->program_id);
        }
        if ($request->filled('model')) {
            $query->where('mlmodels.mlmodel_name', $request->model);
        } else {
            $query->where('mlmodels.mlmodel_name', 'Ensemble'); // Default to Ensemble
        }
        if ($request->filled('academic_year')) {
            $yearStart = explode('-', $request->academic_year)[0];
            $query->where('enrollment_batches.selected_year_start', $yearStart);
        }

        $rawPredictions = $query->get();

        // 4. Format data for the Recharts graphs
        $grouped = [];
        $idCounter = 1;

        foreach ($rawPredictions as $row) {
            $ay = $row->selected_year_start . '-' . $row->selected_year_end;
            // Group by Program + Model + Year
            $key = $row->program_id . '_' . $row->mlmodel_name . '_' . $ay;

            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'prediction_id' => $idCounter++,
                    'program_id' => $row->program_id,
                    'program_name' => $row->program_name,
                    'model' => $row->mlmodel_name,
                    'academic_year' => $ay,
                    'trend' => []
                ];
            }

            // Add the semester data points
            $grouped[$key]['trend'][] = [
                'period' => $row->selected_semester,
                'baseline' => null, // Actual historical data can be joined here later if needed
                'predicted' => (int) $row->predicted_total
            ];
        }

        // 5. Calculate the Main Aggregate Trend (Top Chart)
        $mainTrendMap = ['First' => 0, 'Second' => 0, 'Summer' => 0];
        foreach ($grouped as $group) {
            foreach ($group['trend'] as $t) {
                $mainTrendMap[$t['period']] += $t['predicted'];
            }
        }
        
        $mainTrend = [];
        foreach (['First', 'Second', 'Summer'] as $sem) {
            $mainTrend[] = [
                'period' => $sem,
                'baseline' => null,
                'predicted' => $mainTrendMap[$sem] > 0 ? $mainTrendMap[$sem] : null
            ];
        }

        return Inertia::render('Predictions', [
            'predictionTrends' => array_values($grouped),
            'programs' => $programs,
            'models' => $models,
            'academicYears' => $academicYears,
            'mainTrend' => $mainTrend,
            'filters' => request()->only(['model', 'academic_year', 'program_id'])
        ]);
    }
}