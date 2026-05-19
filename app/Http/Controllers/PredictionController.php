<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class PredictionController extends Controller
{
    public function index()
    {
        return Inertia::render('Predictions', [
            'filters' => [
                'model' => request('model', 'Ensemble'),
                'academicYear' => request('academicYear', ''),
                'programId' => request('programId', ''),
            ],
            // placeholders; replace with real data
            'models' => [],
            'academicYears' => [],
            'programs' => [],
            'mainTrend' => [],
            'predictionTrends' => [],
        ]);
    }
}