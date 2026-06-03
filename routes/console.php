<?php

use Illuminate\Support\Facades\Artisan;
use App\Console\Commands\MLRetrain;

Artisan::command('ml:retrain {--base-year=2026} {--future-years=1}', function () {
    $this->call(MLRetrain::class, [
        '--base-year' => (int) $this->option('base-year'),
        '--future-years' => (int) $this->option('future-years'),
    ]);
})->describe('Run Python multi-model training and persist predictions + metrics to DB');