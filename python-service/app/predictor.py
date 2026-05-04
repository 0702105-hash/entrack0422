import numpy as np
from .db import get_connection

def fetch_enrollment_batch(batch_id: int):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT enrollment_batch_id, program_id, selected_year_start, selected_year_end, selected_semester
                FROM enrollment_batches
                WHERE enrollment_batch_id = %s
                """,
                (batch_id,)
            )
            return cur.fetchone()
    finally:
        conn.close()

def fetch_enrollment_history(program_id: int):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT academic_year_start, academic_year_end, semester, male, female
                FROM enrollments
                WHERE program_id = %s
                ORDER BY academic_year_start, academic_year_end
                """,
                (program_id,)
            )
            return cur.fetchall()
    finally:
        conn.close()

def compute_metrics(actuals, preds):
    y_true = np.array(actuals, dtype=float)
    y_pred = np.array(preds, dtype=float)
    if len(y_true) == 0:
        return dict(mae_value=0.0, rmse_value=0.0, mape_value=0.0, rsquared_value=0.0)
    mae = np.mean(np.abs(y_true - y_pred))
    rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
    mape = np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1))) * 100
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    r2 = 0.0 if ss_tot == 0 else 1 - (ss_res / ss_tot)
    return dict(mae_value=float(mae), rmse_value=float(rmse), mape_value=float(mape), rsquared_value=float(r2))

def predict(batch_id: int, model_name: str):
    batch = fetch_enrollment_batch(batch_id)
    if not batch:
        raise ValueError("Enrollment batch not found")

    history = fetch_enrollment_history(batch["program_id"])
    totals = [row["male"] + row["female"] for row in history]
    males = [row["male"] for row in history]
    females = [row["female"] for row in history]

    window = totals[-3:] if len(totals) >= 3 else totals
    baseline = int(round(np.mean(window))) if window else 0

    male_ratio = (np.sum(males) / np.sum(totals)) if np.sum(totals) > 0 else 0.5
    predicted_male = int(round(baseline * male_ratio))
    predicted_female = int(round(baseline - predicted_male))

    rolling_preds = []
    if len(totals) >= 2:
        for i in range(1, len(totals)):
            rolling_preds.append(np.mean(totals[:i]))
    metrics = compute_metrics(totals[1:], rolling_preds)

    confidence = 0.6 + min(0.3, len(totals) * 0.02)

    return {
        "enrollment_batch_id": batch_id,
        "model_name": model_name,
        "predicted_total": int(baseline),
        "predicted_male": int(predicted_male),
        "predicted_female": int(predicted_female),
        "confidence": float(round(confidence, 4)),
        "metrics": metrics
    }