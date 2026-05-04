<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Prediction extends Model
{
    protected $primaryKey = 'predictions_id';
    protected $fillable = [
        'enrollment_batch_id',
        'predicted_total',
        'predicted_male',
        'predicted_female',
        'confidence',
        'mlmodel_id'
    ];

    public function enrollmentBatch(): BelongsTo
    {
        return $this->belongsTo(EnrollmentBatch::class, 'enrollment_batch_id', 'enrollment_batch_id');
    }

    public function mlmodel(): BelongsTo
    {
        return $this->belongsTo(MLModel::class, 'mlmodel_id', 'mlmodel_id');
    }

    public function modelMetrics(): HasOne
    {
        return $this->hasOne(ModelMetric::class, 'predictions_id', 'predictions_id');
    }
}