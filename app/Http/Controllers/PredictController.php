<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PredictController extends Controller
{
    public function predict(Request $request)
    {
        $file = $request->file('data');
        // Store uploaded file temporarily
        $storagePath = $file->storeAs('ml-input', uniqid() . '_' . $file->getClientOriginalName());
        $fullPath = storage_path('app/' . $storagePath);

        // Call your real python model script
        $command = escapeshellcmd("python3 " . base_path('python/predict_multi_models.py') . ' ' . escapeshellarg($fullPath));
        $output = [];
        $status = 0;
        exec($command, $output, $status);

        if ($status !== 0) {
            return response()->json(['error' => 'ML script failed', 'details' => $output], 500);
        }

        // Your script should print JSON—convert output
        $json = implode('', $output);
        return response()->json(json_decode($json, true));
    }
}