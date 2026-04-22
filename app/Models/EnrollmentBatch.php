<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;


class EnrollmentBatch extends Model
{
    protected $table = 'enrollment_batches';
    protected $primaryKey = 'enrollment_batches_id';
    protected $fillable = ['program_id', 'selected_year_start', 'selected_year_end', 'selected_semester', 'total_male', 'total_female'];

    public function enrollment()
    {
        return $this->belongsToMany(Enrollment::class, 'enrollment_pivot', 'enrollment_id', 'enrollment_batch_id');
    }
    public function predictions(): HasMany
    {
        return $this->hasMany(Prediction::class, 'enrollment_batch_id', 'enrollment_batch_id');
    }

    public function pivot(): HasMany
    {
        return $this->hasMany(EnrollmentPivot::class, 'enrollment_pivot_id', 'enrollment_pivot_id');
    }
}
