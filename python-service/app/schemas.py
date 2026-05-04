from pydantic import BaseModel

class PredictRequest(BaseModel):
    enrollment_batch_id: int
    model_name: str = "ensemble"

class Metrics(BaseModel):
    mae_value: float
    rmse_value: float
    mape_value: float
    rsquared_value: float

class PredictResponse(BaseModel):
    enrollment_batch_id: int
    model_name: str
    predicted_total: int
    predicted_male: int
    predicted_female: int
    confidence: float
    metrics: Metrics