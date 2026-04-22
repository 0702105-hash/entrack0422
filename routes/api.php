<?php
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\MLModelController;
use App\Http\Controllers\PredictionController;
use App\Http\Controllers\ModelMetricController;
use App\Http\Controllers\EnrollmentBatchController;

Route::get('/departments/{id}', [DepartmentController::class, 'show']);
Route::get('/programs/{id}', [ProgramController::class, 'show']);
Route::get('/enrollments/{id}', [EnrollmentController::class, 'show']);
Route::get('/mlmodels/{id}', [MLModelController::class, 'show']);
Route::get('/predictions/{id}', [PredictionController::class, 'show']);
Route::get('/model_metrics/{id}', [ModelMetricController::class, 'show']);
Route::get('enrollment_batches/{id}', [EnrollmentBatchController::class, 'show']);
