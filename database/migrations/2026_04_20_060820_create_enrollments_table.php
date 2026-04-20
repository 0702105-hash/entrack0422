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
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id('enrollment_id');
            $table->integer('program_id');
            $table->foreign('program_id')->references('program_id')->on('programs');
            $table->string('academic_year');
            $table->enum('semester', ['1st', '2nd', 'Summer']);
            $table->string('male');
            $table->string('female');
            $table->unique(['program_id', 'academic_year', 'semester']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
