<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class Diagnose extends Command
{
    protected $signature = 'entrack:diagnose';
    protected $description = 'Read-only dump of what is actually in the database, to debug blank dashboard/programs/analytics pages.';

    public function handle(): int
    {
        $this->info('=== ENTRACK DIAGNOSTIC ===');
        $this->line('Run this, copy the FULL output, and share it back.');
        $this->newLine();

        $this->section('1. Row counts per table');
        foreach (['enrollments', 'enrollment_batches', 'predictions', 'model_metrics', 'mlmodels', 'programs'] as $table) {
            try {
                $count = DB::table($table)->count();
                $this->line("  {$table}: {$count} rows");
            } catch (\Throwable $e) {
                $this->error("  {$table}: ERROR - " . $e->getMessage());
            }
        }

        $this->section('2. mlmodels table contents');
        try {
            foreach (DB::table('mlmodels')->get() as $m) {
                $this->line("  id={$m->mlmodel_id}  name='{$m->mlmodel_name}'");
            }
        } catch (\Throwable $e) {
            $this->error('  ERROR - ' . $e->getMessage());
        }

        $this->section('3. Predictions grouped by model (count, most recent, oldest)');
        try {
            $rows = DB::table('predictions as p')
                ->join('mlmodels as m', 'm.mlmodel_id', '=', 'p.mlmodel_id')
                ->select('m.mlmodel_name', DB::raw('COUNT(*) as cnt'), DB::raw('MAX(p.created_at) as newest'), DB::raw('MIN(p.created_at) as oldest'))
                ->groupBy('m.mlmodel_name')
                ->get();
            if ($rows->isEmpty()) {
                $this->warn('  NO PREDICTIONS FOUND AT ALL (predictions table is empty or the join failed).');
            }
            foreach ($rows as $r) {
                $this->line("  {$r->mlmodel_name}: {$r->cnt} predictions | newest={$r->newest} | oldest={$r->oldest}");
            }
        } catch (\Throwable $e) {
            $this->error('  ERROR - ' . $e->getMessage());
        }

        $this->section('4. Predictions missing a model_metrics row (breaks Analytics page via inner join)');
        try {
            $orphaned = DB::table('predictions as p')
                ->leftJoin('model_metrics as mm', 'mm.predictions_id', '=', 'p.predictions_id')
                ->whereNull('mm.predictions_id')
                ->count();
            $this->line("  {$orphaned} prediction(s) have NO matching model_metrics row.");
            if ($orphaned > 0) {
                $this->warn('  This is why Analytics is blank if this number is high -- it inner-joins model_metrics.');
            }
        } catch (\Throwable $e) {
            $this->error('  ERROR - ' . $e->getMessage());
        }

        $this->section('5. enrollment_batches: distinct (year_start, year_end) with a prediction attached');
        try {
            $years = DB::table('enrollment_batches as eb')
                ->join('predictions as p', 'p.enrollment_batch_id', '=', 'eb.enrollment_batch_id')
                ->select('eb.selected_year_start', 'eb.selected_year_end', DB::raw('COUNT(DISTINCT eb.enrollment_batch_id) as batch_count'))
                ->groupBy('eb.selected_year_start', 'eb.selected_year_end')
                ->orderBy('eb.selected_year_start')
                ->get();
            if ($years->isEmpty()) {
                $this->warn('  No enrollment_batches have any prediction attached at all.');
            }
            foreach ($years as $y) {
                $this->line("  AY {$y->selected_year_start}-{$y->selected_year_end}: {$y->batch_count} batches with predictions");
            }
        } catch (\Throwable $e) {
            $this->error('  ERROR - ' . $e->getMessage());
        }

        $this->section('6. What DashboardController would actually compute right now (period=yearly, the default)');
        try {
            $sinceDate = now()->subDays(365);
            $this->line("  Filtering predictions.created_at >= {$sinceDate->toDateTimeString()} (now = " . now()->toDateTimeString() . ')');
            $batchAverages = DB::table('predictions as p')
                ->join('enrollment_batches as eb', 'eb.enrollment_batch_id', '=', 'p.enrollment_batch_id')
                ->where('p.created_at', '>=', $sinceDate)
                ->select('eb.enrollment_batch_id', DB::raw('AVG(p.predicted_total) as avg_total'))
                ->groupBy('eb.enrollment_batch_id')
                ->get();
            $this->line("  Batches within the recency window: {$batchAverages->count()}");
            $this->line('  Sum of avg_total across those batches (= Dashboard \'Total Predicted\' card): ' . $batchAverages->sum('avg_total'));
        } catch (\Throwable $e) {
            $this->error('  ERROR - ' . $e->getMessage());
        }

        $this->section('7. What ProgramsController would actually compute right now');
        try {
            $latestPredictedYear = DB::table('enrollment_batches')
                ->join('predictions', 'predictions.enrollment_batch_id', '=', 'enrollment_batches.enrollment_batch_id')
                ->max('enrollment_batches.selected_year_start');
            $this->line('  Detected latest predicted year_start: ' . ($latestPredictedYear ?? 'NULL (no predictions found at all)'));
            if ($latestPredictedYear) {
                $count = DB::table('predictions')
                    ->join('enrollment_batches', 'predictions.enrollment_batch_id', '=', 'enrollment_batches.enrollment_batch_id')
                    ->where('enrollment_batches.selected_year_start', $latestPredictedYear)
                    ->count();
                $this->line("  Prediction rows for that year: {$count}");
            }
        } catch (\Throwable $e) {
            $this->error('  ERROR - ' . $e->getMessage());
        }

        $this->section('8. Recent Laravel error log (last 60 lines)');
        try {
            $logPath = storage_path('logs/laravel.log');
            if (file_exists($logPath)) {
                $lines = file($logPath);
                $tail = array_slice($lines, -60);
                foreach ($tail as $line) {
                    $this->line('  ' . rtrim($line));
                }
            } else {
                $this->line('  No laravel.log file found.');
            }
        } catch (\Throwable $e) {
            $this->error('  ERROR - ' . $e->getMessage());
        }

        $this->newLine();
        $this->info('=== END DIAGNOSTIC ===');

        return self::SUCCESS;
    }

    private function section(string $title): void
    {
        $this->newLine();
        $this->line("<fg=cyan>-- {$title} --</>");
    }
}
