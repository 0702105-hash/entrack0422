<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function index()
    {
        // Average metrics per model
        $averageMetrics = DB::table('model_metrics as mm')
            ->join('predictions as p', 'p.predictions_id', '=', 'mm.predictions_id')
            ->join('mlmodels as m', 'm.mlmodel_id', '=', 'p.mlmodel_id')
            ->select([
                'm.mlmodel_name as model_name',
                DB::raw('AVG(mm.mae_value) as mae'),
                DB::raw('AVG(mm.rmse_value) as rmse'),
                DB::raw('AVG(mm.mape_value) as mape'),
                DB::raw('AVG(mm.rsquared_value) as r2'),
            ])
            ->groupBy('m.mlmodel_name')
            ->orderBy('m.mlmodel_name')
            ->get();

        // Metrics per prediction
        $predictionMetrics = DB::table('predictions as p')
            ->join('model_metrics as mm', 'mm.predictions_id', '=', 'p.predictions_id')
            ->join('mlmodels as m', 'm.mlmodel_id', '=', 'p.mlmodel_id')
            ->join('enrollment_batches as eb', 'eb.enrollment_batch_id', '=', 'p.enrollment_batch_id')
            ->join('programs as prog', 'prog.program_id', '=', 'eb.program_id')
            ->select([
                'p.predictions_id',
                'prog.program_name',
                'eb.selected_year_start',
                'eb.selected_year_end',
                'm.mlmodel_name as model_name',
                'mm.mae_value',
                'mm.rmse_value',
                'mm.mape_value',
                'mm.rsquared_value',
            ])
            ->orderBy('p.predictions_id', 'desc')
            ->get()
            ->groupBy('predictions_id')
            ->map(function ($rows) {
                $first = $rows->first();

                return [
                    'prediction_id' => $first->predictions_id,
                    'program_name' => $first->program_name,
                    'academic_year_start' => $first->selected_year_start,
                    'academic_year_end' => $first->selected_year_end,
                    'metrics' => $rows->map(function ($r) {
                        return [
                            'model_name' => $r->model_name,
                            'mae' => $r->mae_value,
                            'rmse' => $r->rmse_value,
                            'mape' => $r->mape_value,
                            'r2' => $r->rsquared_value,
                        ];
                    })->values(),
                ];
            })
            ->values();

        return Inertia::render('Analytics', [
            'averageMetrics' => $averageMetrics,
            'predictionMetrics' => $predictionMetrics,
        ]);
    }
}