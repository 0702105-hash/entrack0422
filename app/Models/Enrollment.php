<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enrollment extends Model
{
    protected $primaryKey = 'enrollment_id';
    protected $fillable = ['program_id', 'academic_year_start', 'academic_year_end', 'semester', 'male', 'female'];
    
    public function enrollmentBatches()
    {
        return $this->belongsToMany(EnrollmentBatch::class, 'enrollment_pivot', 'enrollment_id', 'enrollment_batch');
    }
    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id', 'program_id');
    }

    public function enrollmentPivot(): HasMany
    {
        return $this->hasMany(EnrollmentPivot::class, 'enrollment_id', 'enrollment_id');
    }
}
