<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class PredictController extends Controller
{
    /**
     FOR THE PREDICT BUTTON, TO CREATE PREDICTIONS!
     */
    public function predict(Request $request)
    {
        set_time_limit(600);

        $validated = $request->validate([
            'program_id' => ['required', 'integer'],
            'model' => ['nullable', 'string'],
            'year_start' => ['required', 'integer'],
            'year_end' => ['required', 'integer', 'gt:year_start'],
        ]);

        // The form collects a year range, but the underlying engine forecasts
        // to a single target academic year: year_end (see predict_program.py
        // docstring). year_start only exists to bound the "End Year" dropdown
        // in the UI.
        $targetYear = (int) $validated['year_end'];

        $pythonBin = env('ML_PYTHON_BIN', 'python3');
        $workingDir = base_path('python-service');

        $command = [
            $pythonBin,
            '-m', 'app.predict_program',
            '--program', (string) $validated['program_id'],
            '--target-year', (string) $targetYear,
        ];

        if (!empty($validated['model'])) {
            $command[] = '--model';
            $command[] = $validated['model'];
        }

        $env = [
            'DB_HOST' => (string) config('database.connections.mysql.host'),
            'DB_USERNAME' => (string) config('database.connections.mysql.username'),
            'DB_PASSWORD' => (string) config('database.connections.mysql.password'),
            'DB_DATABASE' => (string) config('database.connections.mysql.database'),
            'PYTHONIOENCODING' => 'utf-8',
            'PYTHONUTF8' => '1',
        ];

        $process = new Process($command, $workingDir, $env);
        $process->setTimeout(600);

        try {
            $process->run();
        } catch (\Throwable $e) {
            Log::error('Prediction process failed to start: ' . $e->getMessage());
            return back()->withErrors(['prediction' => 'Could not start the prediction engine: ' . $e->getMessage()]);
        }

        if (!$process->isSuccessful()) {
            $error = $process->getErrorOutput() ?: $process->getOutput();
            Log::error("Prediction script failed:\n" . $error);

            return back()->withErrors(['prediction' => 'Prediction failed: ' . substr($error, -600)]);
        }

        return redirect()->route('predictions.index')->with('success', 'Forecast generated successfully!');
    }
}
