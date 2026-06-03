<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\Process\Process;
use Illuminate\Support\Facades\Log;

class PredictController extends Controller
{
    public function predict(Request $request)
    {
        $validated = $request->validate([
            'program_id' => 'required|integer',
            'academic_year' => 'required|string',
            'model' => 'required|string',
        ]);

        $scriptPath = base_path('public/predict_multi_models.py');

        // Run the script with arguments
        $process = new Process(['python', $scriptPath, 
            '--program', (string)$validated['program_id'], 
            '--year', $validated['academic_year'],
            '--model', $validated['model']
        ]);

        $process->run();

        if (!$process->isSuccessful()) {
            Log::error($process->getErrorOutput());
            return back()->withErrors(['prediction' => 'Prediction engine failed. Check logs.']);
        }

        // Return back to the predictions page with a success message
        return redirect()->route('predictions.index')->with('success', 'Prediction generated.');
    }
}