<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Symfony\Component\Process\Process;
use Illuminate\Support\Facades\Log;
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
        if ($request->filled('year_start')) {
            $query->where('enrollment_batches.selected_year_start', '>=', $request->year_start);
        }
        if ($request->filled('year_end')) {
            $query->where('enrollment_batches.selected_year_end', '<=', $request->year_end);
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
    public function predict(Request $request)
    {
        try {
            // 1. Get the years
            $yearStart = (int) $request->input('year_start', date('Y'));
            $yearEnd = (int) $request->input('year_end', date('Y') + 1);

            if ($yearEnd <= $yearStart) {
                return back()->withErrors(['prediction' => 'End year must be greater than start year.']);
            }

            $futureYears = $yearEnd - $yearStart;

            // 2. Absolute Paths
            $pythonBin = 'C:\entrack\.venv-ml\Scripts\python.exe';
            $scriptPath = 'C:\entrack\python-service\app\predict_fast.py';

            $command = [
                $pythonBin,
                $scriptPath,
                '--base-year',
                (string) $yearStart,
                '--future-years',
                (string) $futureYears
            ];

            // ==========================================
            // THE WINDOWS BRUTE-FORCE FIX
            // We explicitly give Python the core Windows system paths.
            // Without these, Scikit-Learn's C++ components crash.
            // ==========================================
            $env = [
                'VIRTUAL_ENV' => 'C:\entrack\.venv-ml',
                'PATH' => 'C:\entrack\.venv-ml\Scripts;C:\Windows\System32;C:\Windows;C:\Windows\System32\Wbem',
                'SystemRoot' => 'C:\Windows',
                'SystemDrive' => 'C:',
                'TEMP' => 'C:\Windows\Temp',
                'TMP' => 'C:\Windows\Temp',
            ];

            Log::info("Running Target Prediction Engine...");

            // 3. Execute using the brute-forced environment
            $process = new \Symfony\Component\Process\Process($command, null, $env);
            $process->setTimeout(600); // 10 minutes max
            $process->run();

            if (!$process->isSuccessful()) {
                $error = $process->getErrorOutput() ?: $process->getOutput();
                return back()->withErrors(['prediction' => 'PYTHON FAILED: ' . substr($error, 0, 500)]);
            }

            return redirect()->route('predictions.index')->with('success', 'Forecast generated successfully!');

        } catch (\Throwable $e) {
            return back()->withErrors(['prediction' => 'SERVER CRASH: ' . $e->getMessage()]);
        }
    }
}