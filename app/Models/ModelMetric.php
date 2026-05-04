<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModelMetric extends Model
{
    protected $primaryKey = 'metric_id';
    protected $fillable = ['predictions_id', 'mae_value', 'rmse_value', 'mape_value', 'rsquared_value'];

    public function prediction(): BelongsTo
    {
        return $this->belongsTo(Prediction::class, 'predictions_id', 'predictions_id');
    }
}