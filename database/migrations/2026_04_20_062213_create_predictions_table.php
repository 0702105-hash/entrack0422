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
        Schema::create('predictions', function (Blueprint $table) {
            $table->id('predictions_id');
            $table->integer('enrollment_id');
            $table->foreign('enrollment_id')->references('enrollment_id')->on('enrollments');
            $table->decimal('predicted_total');
            $table->decimal('predicted_male');
            $table->decimal('predicted_female');
            $table->decimal('confidence');
            $table->integer('model_id');
            $table->foreign('model_id')->references('model_id')->on('models');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('predictions');
    }
};
