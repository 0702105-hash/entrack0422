<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Enrollment;
use App\Models\Prediction;
use App\Models\Department;

class Program extends Model
{
    protected $primaryKey = 'program_id';

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'program_id', 'program_id');
    }
}
