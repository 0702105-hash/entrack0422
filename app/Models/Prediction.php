<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;


class Prediction extends Model
{
    protected $primaryKey = 'predictions_id';
    protected $fillable = ['enrollment_id', 'predicted_total', 'predicted_male', 'predicted_female', 'confidence', 'model_id'];
    public function enrollmentBatch(): HasOne
    {
        return $this->HasOne(EnrollmentBatch::class, 'enrollment_batch_id', 'enrollment_batch_id');
    }

    public function mlmodel(): HasOne
    {
        return $this->hasOne(MLModel::class, 'mlmodel_id', 'mlmodel_id');
    }

    public function model_metric(): HasOne{
        return $this->hasOne(ModelMetric::class, 'metric_id', 'metric_id');
    }
}
