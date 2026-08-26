"""
Bulk retrain: retrains LSTM + XGBoost for every program and regenerates
their forecasts. This is the script behind `php artisan ml:retrain` and the
one EnrollmentImportController runs automatically after a CSV import.

For a single program/year/model prediction (the "Run Prediction" panel),
see predict_program.py instead -- it reuses the same predict_for_program()
engine from prediction_engine.py, so a quick single prediction and a full
retrain here will always agree with each other.
"""

import argparse
import time

import mysql.connector

from prediction_engine import (
    get_db_config,
    load_enrollment_data,
    build_gender_ratio_map,
    predict_for_program,
    build_forecast_semester_sequence,
    get_or_create_mlmodel,
    get_or_create_enrollment_batch,
    extract_metrics,
    get_model_confidence,
    clear_existing_predictions,
    SEMESTER_LABELS,
)

print("=" * 80)
print("MULTI-MODEL ENROLLMENT PREDICTION SYSTEM -- BULK RETRAIN")
print("Models: LSTM | XGBoost | Ensemble")
print("=" * 80)


def save_predictions_to_db(all_predictions, future_years=1, base_year=2026, gender_ratio_map=None):
    gender_ratio_map = gender_ratio_map or {}
    conn = mysql.connector.connect(**get_db_config())
    cursor = conn.cursor()

    try:
        # Scoped clear: only the AY range we're about to regenerate, for
        # every program in this run (program_id=None -> all programs).
        clear_existing_predictions(
            cursor,
            year_start_min=base_year,
            year_end_max=base_year + future_years,
            program_id=None,
        )

        inserted = 0

        for pred_result in all_predictions:
            if pred_result is None:
                continue

            program_id = int(pred_result['program_id'])
            avg_male_ratio = float(gender_ratio_map.get(program_id, 0.5))

            model_map = {
                'LSTM': pred_result.get('lstm'),
                'XGBoost': pred_result.get('xgboost'),
                'Ensemble': pred_result.get('ensemble'),
            }

            for model_name, model_result in model_map.items():
                if not model_result or model_result.get('predictions') is None:
                    continue

                mlmodel_id = get_or_create_mlmodel(cursor, model_name)
                metrics = extract_metrics(model_result)
                confidence = float(get_model_confidence({
                    'lstm': pred_result.get('lstm'),
                    'xgboost': pred_result.get('xgboost'),
                }))

                predictions = model_result['predictions'][:future_years * 3]
                forecast_semesters = build_forecast_semester_sequence(len(predictions))

                # Group the forecasted semesters back into academic years
                # (3 semesters per year: First, Second, Summer) instead of
                # pinning every forecasted semester to the same
                # base_year/base_year+1 batch -- otherwise a 2-year-ahead
                # forecast collapsed both years into one mislabeled batch.
                for year_offset in range(future_years):
                    year_slice = predictions[year_offset * 3: (year_offset + 1) * 3]
                    if len(year_slice) == 0:
                        continue

                    this_year_start = base_year + year_offset
                    this_year_end = this_year_start + 1

                    pred_total = int(max(float(sum(year_slice)), 0))
                    pred_male = int(round(pred_total * avg_male_ratio))
                    pred_female = int(pred_total - pred_male)

                    enrollment_batch_id = get_or_create_enrollment_batch(
                        cursor,
                        program_id=program_id,
                        year_start=this_year_start,
                        year_end=this_year_end,
                        semester_label="First",
                        total_male=pred_male,
                        total_female=pred_female,
                    )

                    cursor.execute("""
                        INSERT INTO predictions
                            (enrollment_batch_id, mlmodel_id, predicted_total, predicted_male, predicted_female, confidence, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                    """, (
                        enrollment_batch_id, mlmodel_id, pred_total, pred_male, pred_female, confidence,
                    ))
                    prediction_id = cursor.lastrowid

                    cursor.execute("""
                        INSERT INTO model_metrics
                        (predictions_id, mae_value, rmse_value, mape_value, rsquared_value, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                    """, (
                        prediction_id, metrics['mae_value'], metrics['rmse_value'],
                        metrics['mape_value'], metrics['rsquared_value'],
                    ))

                    inserted += 1

        conn.commit()
        print(f"Saved {inserted} prediction rows for AY {base_year}-{base_year + future_years}")

    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    total_started = time.perf_counter()

    parser = argparse.ArgumentParser()
    parser.add_argument("--base-year", type=int, default=2026)
    parser.add_argument("--future-years", type=int, default=1)
    args = parser.parse_args()

    future_years = args.future_years
    base_year = args.base_year

    df_hist = load_enrollment_data()
    if df_hist is None:
        exit(1)

    gender_ratio_map = build_gender_ratio_map(df_hist)

    all_predictions = []
    for program_id in sorted(df_hist['program_id'].unique()):
        program_data = df_hist[df_hist['program_id'] == program_id].copy()
        result = predict_for_program(program_id, program_data, future_years=future_years)
        if result:
            all_predictions.append(result)

    if all_predictions:
        save_predictions_to_db(
            all_predictions,
            future_years=future_years,
            base_year=base_year,
            gender_ratio_map=gender_ratio_map,
        )
    else:
        print("No predictions were generated to save.")

    total_elapsed = time.perf_counter() - total_started
    print(f"Total retrain time: {total_elapsed:.2f}s")
