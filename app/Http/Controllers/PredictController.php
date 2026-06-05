<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\Process\Process;
use Illuminate\Support\Facades\Log;

class PredictController extends Controller
{
    public function predict(Request $request)
    {
        set_time_limit(600);
        try {
            $programId = $request->input('program_id');
            $model = $request->input('model');
            $yearStart = (int) $request->input('year_start');
            $yearEnd = (int) $request->input('year_end');
            $futureYears = $yearEnd - $yearStart;

            if ($yearEnd <= $yearStart) {
                return back()->withErrors(['prediction' => 'End year must be greater than start year.']);
            }

            $futureYears = $yearEnd - $yearStart;

            $pythonScript = 'C:\entrack\python-service\app\predict_fast.py';

            // 1. Point directly to the python executable, skipping CMD wrappers
            $pythonExe = 'C:\entrack\.venv-ml\Scripts\python.exe';
            $scriptPath = 'C:\entrack\python-service\app\predict_fast.py';
            $command = [
                $pythonExe,
                $pythonScript,
                '--program',
                (string) $programId,
                '--model',
                $model,
                '--base-year',
                (string) $yearStart,
                '--future-years',
                (string) $futureYears
            ];
            $process = new \Symfony\Component\Process\Process($command);

            // 2. Set working directory strictly to the python app folder
            $process->setWorkingDirectory('C:\entrack\python-service\app');
            $process->setTimeout(600); // 10 minutes

            $env = array_merge(getenv(), [
                'VIRTUAL_ENV' => 'C:\entrack\.venv-ml',
                'PATH' => 'C:\entrack\.venv-ml\Scripts;' . getenv('PATH'),
                'TF_ENABLE_ONEDNN_OPTS' => '0',
                'TF_CPP_MIN_LOG_LEVEL' => '3',
            ]);
            $process->setEnv($env);

            \Illuminate\Support\Facades\Log::info("Running Prediction Engine natively...");

            $process->run();

            if (!$process->isSuccessful()) {
                $error = $process->getErrorOutput() ?: $process->getOutput();

                // Write the full unabridged error to storage/logs/laravel.log
                \Illuminate\Support\Facades\Log::error("PYTHON CRASH LOG:\n" . $error);

                // Grab the LAST 600 characters where the actual error reason is located
                $shortError = substr($error, -600);
                return back()->withErrors(['prediction' => 'PYTHON FAILED: ...' . $shortError]);
            }

            return redirect()->route('predictions.index')->with('success', 'Forecast generated successfully!');

        } catch (\Throwable $e) {
            return back()->withErrors(['prediction' => 'SERVER CRASH: ' . $e->getMessage()]);
        }
    }
}