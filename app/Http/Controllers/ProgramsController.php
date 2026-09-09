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
        $programs = DB::table('programs')->get();

        // Show whichever academic year the most recent predictions were
        // actually generated for, instead of a hardcoded literal (2026)
        // that only happened to be correct for one calendar year and would
        // silently show zero/stale data for every other target year the
        // Dean picks, forever after.
        $latestPredictedYear = DB::table('enrollment_batches')
            ->join('predictions', 'predictions.enrollment_batch_id', '=', 'enrollment_batches.enrollment_batch_id')
            ->max('enrollment_batches.selected_year_start');

        $nextAYStart = $latestPredictedYear ?? (int) date('Y');
        $nextAYEnd = $nextAYStart + 1;

        // Query the total yearly predictions for each program & model
        $yearlyPredictions = DB::table('predictions')
            ->join('enrollment_batches', 'predictions.enrollment_batch_id', '=', 'enrollment_batches.enrollment_batch_id')
            ->join('mlmodels', 'predictions.mlmodel_id', '=', 'mlmodels.mlmodel_id')
            ->where('enrollment_batches.selected_year_start', $nextAYStart)
            ->select(
                'enrollment_batches.program_id',
                'mlmodels.mlmodel_name',
                DB::raw('SUM(predictions.predicted_total) as yearly_total'),
                DB::raw('SUM(predictions.predicted_male) as yearly_male'),
                DB::raw('SUM(predictions.predicted_female) as yearly_female'),
                DB::raw('AVG(predictions.confidence) as avg_confidence')
            )
            ->groupBy('enrollment_batches.program_id', 'mlmodels.mlmodel_name')
            ->get();

        // Format the data into an easy-to-read array for the frontend table
        $programsData = $programs->map(function ($program) use ($yearlyPredictions, $nextAYStart, $nextAYEnd) {

            // Filter predictions belonging to this specific program
            $progPreds = $yearlyPredictions->where('program_id', $program->program_id);

            $byModel = [
                'LSTM' => $progPreds->where('mlmodel_name', 'LSTM')->first(),
                'XGBoost' => $progPreds->where('mlmodel_name', 'XGBoost')->first(),
                'Ensemble' => $progPreds->where('mlmodel_name', 'Ensemble')->first(),
            ];

            $breakdown = collect($byModel)->map(fn ($row, $name) => [
                'model' => $name,
                'total' => (int) ($row->yearly_total ?? 0),
                'male' => (int) ($row->yearly_male ?? 0),
                'female' => (int) ($row->yearly_female ?? 0),
                'confidence' => $row ? round((float) $row->avg_confidence * 100, 1) : null,
            ])->values();

            // Average across whichever models actually have a prediction for
            // this program+year -- not a hardcoded /3, since a program might
            // only have 1 or 2 of the 3 models run for it.
            $present = $breakdown->filter(fn ($m) => $m['confidence'] !== null);
            $average = $present->isEmpty() ? 0 : (int) round($present->avg('total'));
            $averageMale = $present->isEmpty() ? 0 : (int) round($present->avg('male'));
            $averageFemale = $present->isEmpty() ? 0 : (int) round($present->avg('female'));

            return [
                'program_id' => $program->program_id,
                'program_name' => $program->program_name,
                'academic_year' => "$nextAYStart-$nextAYEnd",
                'average' => $average,
                'average_male' => $averageMale,
                'average_female' => $averageFemale,
                'has_predictions' => $present->isNotEmpty(),
                // Per-model breakdown for the "view details" modal. 'Prophet'
                // was removed system-wide (never implemented in the actual
                // engine, so it would always read 0) -- see MLModelSeeder.
                'breakdown' => $breakdown,
                'predictions' => [
                    'LSTM' => (int) ($byModel['LSTM']->yearly_total ?? 0),
                    'XGBoost' => (int) ($byModel['XGBoost']->yearly_total ?? 0),
                    'Ensemble' => (int) ($byModel['Ensemble']->yearly_total ?? 0),
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