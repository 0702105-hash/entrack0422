<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MLModel extends Model
{
    protected $table = 'mlmodels';
    protected $primaryKey = 'mlmodel_id';
    protected $fillable = ['mlmodel_name'];

    public function predictions(): HasMany
    {
        return $this->hasMany(Prediction::class, 'mlmodel_id', 'mlmodel_id');
    }
}