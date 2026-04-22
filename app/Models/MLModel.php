<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MLModel extends Model
{
    protected $table = 'mlmodels';
    protected $primaryKey = 'mlmodel_id';
    protected $fillable = ['mlmodel_name'];

    public function predictions(): BelongsTo
    {
        return $this->belongsTo(Prediction::class, 'mlmodel_id', 'mlmodel_id');
    }
}
