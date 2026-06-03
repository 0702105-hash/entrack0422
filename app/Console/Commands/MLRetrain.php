<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class MLRetrain extends Command
{
    protected $signature = 'ml:retrain
                            {--base-year=2026 : Base academic year start (e.g. 2026 for AY 2026-2027)}
                            {--future-years=1 : Years to predict (1 year = 3 semesters)}';

    protected $description = 'Run Python multi-model training and persist predictions + metrics to DB';

    public function handle(): int
    {
        $baseYear = (int) $this->option('base-year');
        $futureYears = (int) $this->option('future-years');

        $python = env('ML_PYTHON_BIN', 'python3');
        $script = base_path('python-service/app/train_multi_models.py');

        $this->info("Running retrain: baseYear={$baseYear}, futureYears={$futureYears}");
        $this->info("Python: {$python}");
        $this->info("Script: {$script}");

        // Pass DB env to Python so it uses the SAME DB as Laravel
        $env = [
            'DB_HOST' => (string) config('database.connections.mysql.host'),
            'DB_USERNAME' => (string) config('database.connections.mysql.username'),
            'DB_PASSWORD' => (string) config('database.connections.mysql.password'),
            'DB_DATABASE' => (string) config('database.connections.mysql.database'),
            'PYTHONIOENCODING' => 'utf-8',
            'PYTHONUTF8' => '1',
        ];

        $process = new Process([
            $python,
            '-m',
            'app.train_multi_models',
            '--base-year',
            (string) $baseYear,
            '--future-years',
            (string) $futureYears,
        ], base_path('python-service'), $env);

        $process->setTimeout(60 * 30); // 30 minutes
        $process->run(function ($type, $buffer) {
            echo $buffer;
        });

        if (!$process->isSuccessful()) {
            $this->error('Retrain failed.');
            $this->error($process->getErrorOutput());
            return self::FAILURE;
        }

        $this->info('Retrain completed and saved to DB.');
        return self::SUCCESS;
    }
}