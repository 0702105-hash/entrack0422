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
        Schema::create('enrollment_batches', function (Blueprint $table) {
            $table->id('enrollment_batch_id');
            $table->id('program_id');
            $table->foreign('program_id')->references('program_id')->on('programs');
            $table->integer('selected_year_start');
            $table->integer('selected_year_end');
            $table->enum('selected_semester', ['First', 'Second', 'Summer']);
            $table->integer('total_male');
            $table->integer('total_female');
            $table->unique(['program_id', 'selected_year_start', 'selected_year_end', 'selected_semester']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollment_batches');
    }
};
