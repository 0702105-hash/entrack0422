<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    protected $primaryKey = 'enrollment_id';
    
    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id', 'program_id');
    }

    public function predictions(): HasMany
    {
        return $this->hasMany(Prediction::class, 'enrollment_id', 'enrollment_id');
    }
}
