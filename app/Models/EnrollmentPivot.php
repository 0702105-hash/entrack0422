<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnrollmentPivot extends Model
{
    protected $table = 'enrollment_pivot';
    protected $primaryKey = 'enrollment_pivot_id';
    protected $fillable = ['enrollment_id', 'enrollment_batch_id'];
    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class, 'enrollment_id', 'enrollment_id');
    }

    public function enrollmentBatch(): BelongsTo
    {
        return $this->belongsTo(EnrollmentBatches::class, 'enrollment_batch_id', 'enrollment_batch_id');
    }


}
