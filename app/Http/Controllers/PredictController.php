<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\Process\Process;
use Illuminate\Support\Facades\Log;

class PredictController extends Controller
{
    public function predict(Request $request)
    {
        try {
            // 1. Get the exact filters selected in React
            $programId = $request->input('program_id');
            $model = $request->input('model');
            $yearStart = (int) $request->input('year_start');
            $yearEnd = (int) $request->input('year_end');

            if ($yearEnd <= $yearStart) {
                return back()->withErrors(['prediction' => 'End year must be greater than start year.']);
            }

            // 2. Format the year (e.g. "2026-2027")
            $academicYear = $yearStart . '-' . $yearEnd;

            // 3. Absolute Paths to the virtual environment and script
            $pythonBin = 'C:\entrack\.venv-ml\Scripts\python.exe';
            $scriptPath = 'C:\entrack\python-service\predict_multi_models.py';

            // 4. Build the Process explicitly (No cmd.exe hacks needed)
            $process = new Process([
                $pythonBin,
                $scriptPath,
                '--program', (string)$programId,
                '--year', $academicYear,
                '--model', $model
            ]);

            // ==========================================
            // THE MAGIC FIX: Inject the Virtual Environment variables directly!
            // This gives Scikit-Learn its DLL paths without needing activate.bat
            // ==========================================
            $process->setEnv([
                'VIRTUAL_ENV' => 'C:\entrack\.venv-ml',
                'PATH' => 'C:\entrack\.venv-ml\Scripts;' . getenv('PATH'),
            ]);

            Log::info("Running Target Prediction...");

            // 5. Execute
            $process->setTimeout(300); 
            $process->run();

            if (!$process->isSuccessful()) {
                $error = $process->getErrorOutput() ?: $process->getOutput();
                return back()->withErrors(['prediction' => 'PYTHON FAILED: ' . substr($error, 0, 400)]);
            }

            return redirect()->route('predictions.index')->with('success', 'Forecast generated successfully!');

        } catch (\Throwable $e) {
            return back()->withErrors(['prediction' => 'SERVER CRASH: ' . $e->getMessage()]);
        }
    }
}