from fastapi import FastAPI, HTTPException
from .schemas import PredictRequest, PredictResponse
from .predictor import predict

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", response_model=PredictResponse)
def predict_endpoint(payload: PredictRequest):
    try:
        result = predict(payload.enrollment_batch_id, payload.model_name)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))