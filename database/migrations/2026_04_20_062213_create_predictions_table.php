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
            $table->integer('enrollment_batch_id');
            $table->foreign('enrollment_batch_id')->references('enrollment_batch_id')->on('enrollment_batches');
            $table->decimal('predicted_total');
            $table->decimal('predicted_male');
            $table->decimal('predicted_female');
            $table->decimal('confidence');
            $table->integer('mlmodel_id');
            $table->foreign('mlmodel_id')->references('mlmodel_id')->on('mlmodels');
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
