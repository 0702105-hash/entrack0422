<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('model_metrics', function (Blueprint $table) {
            $table->id('metric_id');
            $table->integer('prediction_id');
            $table->foreign('prediction_id')->references('prediction_id')->on('predictions');
            $table->decimal('mae_value');
            $table->decimal('rmse_value');
            $table->decimal('mape_value');
            $table->decimal('rsquared_value');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('model_metrics');
    }
};
