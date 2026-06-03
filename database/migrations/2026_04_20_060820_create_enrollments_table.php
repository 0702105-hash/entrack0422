<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id('enrollment_id');
            $table->foreignId('program_id')->constrained('programs', 'program_id')->onDelete('cascade');
            $table->integer('academic_year_start');
            $table->integer('academic_year_end');
            $table->enum('semester', ['First', 'Second', 'Summer']);
            $table->integer('male');
            $table->integer('female');
            $table->unique(
                ['program_id', 'academic_year_start', 'academic_year_end', 'semester'],
                'enrollments_prog_year_sem_uq'
            );
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
