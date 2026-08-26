<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Enrollment;
use App\Models\Program;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Artisan;

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

            // Trigger the ML pipeline to retrain and reseed predictions.
            // This used to spawn its own hardcoded-Windows-path Process call
            // (a second copy of the same bug PredictController had). It now
            // just calls the same `ml:retrain` Artisan command the Retrain
            // button uses, which already resolves paths correctly.
            $exitCode = Artisan::call('ml:retrain', [
                '--base-year' => (int) date('Y'),
                '--future-years' => 1,
            ]);

            if ($exitCode !== 0) {
                $output = Artisan::output();
                Log::error('ML pipeline failed after CSV import: ' . $output);
                return redirect()->back()->with('success', 'Data imported. Warning: ML pipeline failed — ' . substr($output, -400));
            }

            return redirect()->back()->with('success', 'CAS Enrollment data imported and predictions updated.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Import Error: ' . $e->getMessage());
            return redirect()->back()->withErrors(['file' => 'Import failed: ' . $e->getMessage()]);
        }
    }
}