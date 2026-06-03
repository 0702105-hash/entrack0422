<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProgramsController;
use App\Http\Controllers\PredictController; // Ensure logic is here
use App\Http\Controllers\PredictionController; // Ensure view logic is here
use App\Http\Controllers\PredictionRetrainController;
use App\Http\Controllers\EnrollmentImportController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Programs Routes
    Route::get('/programs', [ProgramsController::class, 'index'])->name('programs.index'); 
    Route::get('/programs/manage', [ProgramsController::class, 'manage'])->name('programs.manage');
    Route::post('/programs', [ProgramsController::class, 'store'])->name('programs.store');
    Route::put('/programs/{program}', [ProgramsController::class, 'update'])->name('programs.update');
    Route::delete('/programs/{program}', [ProgramsController::class, 'destroy'])->name('programs.destroy');
    
    // Prediction Routes
    Route::get('/predictions', [PredictionController::class, 'index'])->name('predictions.index');
    Route::post('/predict', [PredictController::class, 'predict'])->name('predict'); // Use PredictController
    Route::post('/predictions/retrain', [PredictionRetrainController::class, 'retrain'])->name('predictions.retrain');
    
    // Import Route
    Route::post('/programs/import-enrollments', [EnrollmentImportController::class, 'store'])->name('enrollments.import');
    
});

// Debug route
Route::get('/debug-session', function () {
    return response()->json([
        'session' => session()->all(),
        'user' => auth()->user()
    ]);
});

require __DIR__ . '/settings.php';