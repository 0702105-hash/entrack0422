<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    protected $primaryKey = 'department_id';
    protected $fillable = ['department_name'];
    public function programs(): HasMany
    {
        return $this->hasMany(Program::class, 'department_id', 'department_id');
    }
}
