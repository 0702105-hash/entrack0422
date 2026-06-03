<?php

namespace App\Http\Controllers;

use App\Models\Program;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ProgramsController extends Controller
{
    public function index()
    {
        // Define the target Academic Year
        $nextAYStart = 2026;
        $nextAYEnd = 2027;

        $programs = DB::table('programs')->get();

        // Query the total yearly predictions for each program & model
        $yearlyPredictions = DB::table('predictions')
            ->join('enrollment_batches', 'predictions.enrollment_batch_id', '=', 'enrollment_batches.enrollment_batch_id')
            ->join('mlmodels', 'predictions.mlmodel_id', '=', 'mlmodels.mlmodel_id')
            ->where('enrollment_batches.selected_year_start', $nextAYStart)
            ->select(
                'enrollment_batches.program_id',
                'mlmodels.mlmodel_name',
                DB::raw('SUM(predictions.predicted_total) as yearly_total')
            )
            ->groupBy('enrollment_batches.program_id', 'mlmodels.mlmodel_name')
            ->get();

        // Format the data into an easy-to-read array for the frontend table
        $programsData = $programs->map(function ($program) use ($yearlyPredictions, $nextAYStart, $nextAYEnd) {

            // Filter predictions belonging to this specific program
            $progPreds = $yearlyPredictions->where('program_id', $program->program_id);

            return [
                'program_id' => $program->program_id,
                'program_name' => $program->program_name,
                'academic_year' => "$nextAYStart-$nextAYEnd",
                // Extract the sum for each model
                'predictions' => [
                    'Prophet' => (int) ($progPreds->where('mlmodel_name', 'Prophet')->first()->yearly_total ?? 0),
                    'LSTM' => (int) ($progPreds->where('mlmodel_name', 'LSTM')->first()->yearly_total ?? 0),
                    'XGBoost' => (int) ($progPreds->where('mlmodel_name', 'XGBoost')->first()->yearly_total ?? 0),
                    'Ensemble' => (int) ($progPreds->where('mlmodel_name', 'Ensemble')->first()->yearly_total ?? 0),
                ]
            ];
        });

        return Inertia::render('Programs', [
            'programs' => $programsData
        ]);
    }
    public function manage()
    {
        // Fetch all programs to pass to your React component
        $programs = DB::table('programs')->get();

        return Inertia::render('ProgramsManage', [
            'programs' => $programs
        ]);
    }

    // 2. Create a new program (Handles POST /programs)
    public function store(Request $request)
    {
        $request->validate([
            'program_name' => 'required|string|max:255|unique:programs,program_name',
        ]);

        DB::table('programs')->insert([
            'program_name' => $request->program_name,
            'department_id' => 1,
        ]);

        // Returns back to the page, Inertia automatically updates the table!
        return back()->with('success', 'Program created successfully.');
    }

    // 3. Update an existing program (Handles PUT /programs/{id})
    public function update(Request $request, $id)
    {
        $request->validate([
            // Ensure the name is unique, but ignore the current program's ID
            'program_name' => 'required|string|max:255|unique:programs,program_name,' . $id . ',program_id',
        ]);

        DB::table('programs')
            ->where('program_id', $id)
            ->update([
                'program_name' => $request->program_name
            ]);

        return back()->with('success', 'Program updated successfully.');
    }

    public function destroy($id)
    {
        DB::table('programs')->where('program_id', $id)->delete();

        return back()->with('success', 'Program deleted successfully.');
    }
}