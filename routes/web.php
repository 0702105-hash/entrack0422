<?php

use App\Http\Controllers\PredictionController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProgramsController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/programs', [ProgramsController::class, 'index'])->name('programs.store');

    Route::get('/programs/manage', [ProgramsController::class, 'manage'])->name('programs.manage');
    Route::get('/programs/{program}/edit', [ProgramsController::class, 'edit'])->name('programs.edit');
    Route::put('/programs/{program}', [ProgramsController::class, 'update'])->name('programs.update');
    Route::delete('/programs/{program}', [ProgramsController::class, 'destroy'])->name('programs.destroy');
    Route::get('/predictions', [PredictionController::class, 'index'])->name('predictions.index');
});
require __DIR__ . '/settings.php';

