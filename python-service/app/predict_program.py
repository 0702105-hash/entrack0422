"""
Scoped, interactive prediction: the Dean picks ONE program, ONE target
academic year, and ONE model (or leaves it to generate all three) from the
"Run Prediction" panel. This recursively forecasts forward from that
program's latest historical academic year up to and including the target
year, using the exact same predict_for_program() engine the bulk
Retrain/Import path uses -- so a quick single prediction and a full retrain
never disagree.

Invoked by Laravel's PredictController as:
    python -m app.predict_program --program 3 --model Ensemble --target-year 2028

Only that program+target-year's own prior prediction rows are cleared
before saving new ones -- never the whole predictions table.
"""

import argparse
import sys

import mysql.connector
import numpy as np

from prediction_engine import (
    get_db_config,
    load_enrollment_data,
    build_gender_ratio_map,
    predict_for_program,
    parse_academic_year_start,
    get_or_create_mlmodel,
    get_or_create_enrollment_batch,
    extract_metrics,
    get_model_confidence,
    clear_existing_predictions,
    MODEL_NAMES,
)


def run(program_id, target_year_start, model_name_filter=None):
    df_hist = load_enrollment_data()
    if df_hist is None:
        raise RuntimeError("No historical enrollment data found. Import enrollment data first.")

    program_data = df_hist[df_hist['program_id'] == program_id].copy()
    if program_data.empty:
        raise RuntimeError(f"No historical data found for program_id={program_id}.")

    gender_ratio_map = build_gender_ratio_map(program_data)

    last_year_start = int(program_data['academic_year'].apply(parse_academic_year_start).max())
    future_years_needed = target_year_start - last_year_start
    if future_years_needed < 1:
        raise RuntimeError(
            f"Target year {target_year_start} must be after the latest historical "
            f"academic year on file ({last_year_start}). Pick a later target year, "
            f"or import more recent enrollment data first."
        )

    result = predict_for_program(program_id, program_data, future_years=future_years_needed)
    if result is None:
        raise RuntimeError("Not enough historical data to generate a forecast for this program.")

    model_map = {
        'LSTM': result.get('lstm'),
        'XGBoost': result.get('xgboost'),
        'Ensemble': result.get('ensemble'),
    }
    if model_name_filter:
        matched = {k: v for k, v in model_map.items() if k.lower() == model_name_filter.lower()}
        if not matched:
            raise RuntimeError(
                f"Unknown model '{model_name_filter}'. Expected one of: {', '.join(MODEL_NAMES)}."
            )
        model_map = matched

    avg_male_ratio = float(gender_ratio_map.get(program_id, 0.5))
    target_year_end = target_year_start + 1

    conn = mysql.connector.connect(**get_db_config())
    cursor = conn.cursor()
    saved = []
    try:
        # Scoped clear: only THIS program's THIS-year predictions, never the
        # rest of the table (see prediction_engine.clear_existing_predictions
        # docstring for why that matters).
        clear_existing_predictions(
            cursor, year_start_min=target_year_start, year_end_max=target_year_start, program_id=program_id
        )

        for model_name, model_result in model_map.items():
            if not model_result or model_result.get('predictions') is None:
                continue

            # The last 3 forecasted semesters (First+Second+Summer) land in
            # the target academic year; sum them into one annual total. The
            # rest of the app already works in annual totals (charts,
            # historical baselines), so this keeps predictions comparable to
            # the historical line instead of showing one-semester-sized
            # numbers.
            predictions = model_result['predictions'][-3:]
            pred_total = int(max(float(np.sum(predictions)), 0))
            pred_male = int(round(pred_total * avg_male_ratio))
            pred_female = int(pred_total - pred_male)

            mlmodel_id = get_or_create_mlmodel(cursor, model_name)
            metrics = extract_metrics(model_result)
            confidence = float(get_model_confidence({'lstm': result.get('lstm'), 'xgboost': result.get('xgboost')}))

            # NOTE: the "Run Prediction" form only asks for a year, not a
            # semester, so this is saved as one annual total under a
            # placeholder selected_semester of "First" -- consistent with
            # how the bulk retrain path stores annual forecasts too. It does
            # not mean "First semester only."
            enrollment_batch_id = get_or_create_enrollment_batch(
                cursor,
                program_id=program_id,
                year_start=target_year_start,
                year_end=target_year_end,
                semester_label="First",
                total_male=pred_male,
                total_female=pred_female,
            )

            cursor.execute("""
                INSERT INTO predictions
                    (enrollment_batch_id, mlmodel_id, predicted_total, predicted_male, predicted_female, confidence, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
            """, (enrollment_batch_id, mlmodel_id, pred_total, pred_male, pred_female, confidence))
            prediction_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO model_metrics
                (predictions_id, mae_value, rmse_value, mape_value, rsquared_value, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
            """, (prediction_id, metrics['mae_value'], metrics['rmse_value'], metrics['mape_value'], metrics['rsquared_value']))

            saved.append({
                'model': model_name, 'predicted_total': pred_total,
                'predicted_male': pred_male, 'predicted_female': pred_female,
            })

        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    if not saved:
        raise RuntimeError("No predictions were generated -- check that the requested model name is valid.")

    return saved


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--program", type=int, required=True)
    parser.add_argument("--target-year", type=int, required=True,
                         help="Start year of the academic year to predict, e.g. 2028 for AY 2028-2029.")
    parser.add_argument("--model", type=str, default=None,
                         help="LSTM, XGBoost, or Ensemble. Omit to generate all three.")
    args = parser.parse_args()

    try:
        saved_rows = run(program_id=args.program, target_year_start=args.target_year, model_name_filter=args.model)
        for row in saved_rows:
            print(f"SUCCESS: {row['model']} predicted {row['predicted_total']} students "
                  f"(M:{row['predicted_male']} F:{row['predicted_female']}) "
                  f"for program {args.program}, AY {args.target_year}-{args.target_year + 1}.")
        sys.exit(0)
    except Exception as e:
        print(f"PREDICTION FAILED: {e}")
        sys.exit(1)
