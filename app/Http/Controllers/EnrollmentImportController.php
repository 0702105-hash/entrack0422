<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Enrollment;
use App\Models\Program;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EnrollmentImportController extends Controller
{
    public function store(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt|max:10240']);

        $fileData = array_map('str_getcsv', file($request->file('file')->getRealPath()));
        array_shift($fileData); // Remove headers

        DB::beginTransaction();

        try {
            foreach ($fileData as $index => $row) {
                if (count($row) < 6)
                    continue; // Basic validation

                // Mapping by index (Column 0: AY Start, 1: AY End, 2: Sem, 3: Program, 4: Male, 5: Female)
                $ayStart = (int) trim($row[0]);
                $ayEnd = (int) trim($row[1]);
                $semester = trim($row[2]);
                $programName = trim($row[3]);
                $male = (int) $row[4];
                $female = (int) $row[5];

                $program = Program::where('program_name', 'LIKE', $programName)->first();

                if ($program) {
                    Enrollment::updateOrCreate(
                        [
                            'program_id' => $program->getKey(),
                            'academic_year_start' => $ayStart,
                            'academic_year_end' => $ayEnd,
                            'semester' => $semester,
                        ],
                        [
                            'male' => $male,
                            'female' => $female,
                        ]
                    );
                } else {
                    Log::error("Import Row $index: Program '$programName' not found.");
                }
            }
            // After DB::commit(); in EnrollmentImportController::store()

            DB::commit();

            // Trigger the ML pipeline to retrain and reseed predictions
            $pythonBin = 'C:\entrack\.venv-ml\Scripts\python.exe';
            $scriptPath = 'C:\entrack\python-service\app\train_multi_models.py';

            $env = [
                'VIRTUAL_ENV' => 'C:\entrack\.venv-ml',
                'PATH' => 'C:\entrack\.venv-ml\Scripts;C:\Windows\System32;C:\Windows;C:\Windows\System32\Wbem',
                'SystemRoot' => 'C:\Windows',
                'SystemDrive' => 'C:',
                'TEMP' => 'C:\Windows\Temp',
                'TMP' => 'C:\Windows\Temp',
                'DB_HOST' => env('DB_HOST', '127.0.0.1'),
                'DB_USERNAME' => env('DB_USERNAME', 'root'),
                'DB_PASSWORD' => env('DB_PASSWORD', ''),
                'DB_DATABASE' => env('DB_DATABASE', 'entrack'),
            ];

            $process = new \Symfony\Component\Process\Process(
                [$pythonBin, $scriptPath, '--base-year', (string) date('Y'), '--future-years', '1'],
                null,
                $env
            );
            $process->setTimeout(900);
            $process->run();

            if (!$process->isSuccessful()) {
                Log::error('ML pipeline failed after CSV import: ' . $process->getErrorOutput());
                return redirect()->back()->with('success', 'Data imported. Warning: ML pipeline failed — ' . substr($process->getErrorOutput(), 0, 200));
            }

            return redirect()->back()->with('success', 'CAS Enrollment data imported and predictions updated.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Import Error: ' . $e->getMessage());
            return redirect()->back()->withErrors(['file' => 'Import failed: ' . $e->getMessage()]);
        }
    }
}