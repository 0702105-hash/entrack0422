<?php

use App\Http\Controllers\PredictionController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProgramsController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

# Route::middleware(['auth', 'verified'])->group(function () {
Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
# });
Route::get('/programs', [ProgramsController::class, 'index'])->name('programs.index');
Route::get('/predictions', [PredictionController::class, 'index'])->name('predictions.index');
require __DIR__.'/settings.php';

