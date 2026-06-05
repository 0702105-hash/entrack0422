import os
import sys
import argparse
import joblib
import numpy as np
import tensorflow as tf
import mysql.connector
from dotenv import load_dotenv
import warnings

warnings.filterwarnings('ignore')
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '3')
os.environ.setdefault('TF_ENABLE_ONEDNN_OPTS', '0')

current_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(current_dir)

load_dotenv(dotenv_path=r'C:\entrack\.env')

DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'user': os.getenv('DB_USERNAME', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_DATABASE', 'entrack')
}

parser = argparse.ArgumentParser()
parser.add_argument("--program", type=int, required=True)
parser.add_argument("--model", type=str, required=True)
parser.add_argument("--base-year", type=int, required=True)
parser.add_argument("--future-years", type=int, required=True)
args = parser.parse_args()

def save_to_database(prog_id, model_choice, target_year, total_students):
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Get Model ID
    cursor.execute("SELECT mlmodel_id FROM mlmodels WHERE mlmodel_name LIKE %s LIMIT 1", (f"{model_choice}%",))
    row = cursor.fetchone()
    model_id = row[0] if row else 1

    # Get Batch ID
    cursor.execute("SELECT enrollment_batch_id FROM enrollment_batches WHERE program_id = %s AND selected_year_start = %s LIMIT 1", (prog_id, target_year))
    batch_row = cursor.fetchone()
    if batch_row:
        batch_id = batch_row[0]
    else:
        cursor.execute("INSERT INTO enrollment_batches (program_id, selected_year_start, selected_year_end) VALUES (%s, %s, %s)", (prog_id, target_year, target_year + 1))
        conn.commit()
        batch_id = cursor.lastrowid

    # Calculate splits for Laravel Migration Schema
    male_pred = total_students * 0.5
    female_pred = total_students * 0.5
    confidence = 0.85

    query = """
        INSERT INTO predictions 
        (enrollment_batch_id, predicted_total, predicted_male, predicted_female, confidence, mlmodel_id) 
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    try:
        cursor.execute(query, (batch_id, total_students, male_pred, female_pred, confidence, model_id))
        conn.commit()
    except Exception as e:
        print(f"DB Insert Error: {e}")
    finally:
        conn.close()

def run_prediction():
    prog_id = args.program
    model_choice = args.model.lower()
    target_year = args.base_year + args.future_years

    state_file = f'saved_models/history_prog_{prog_id}.pkl'
    if not os.path.exists(state_file):
        print(f"Error: Could not find trained state for Program {prog_id}.")
        sys.exit(1)

    state = joblib.load(state_file)
    scaler = state['scaler']
    last_sequence = state['last_sequence_unscaled']
    
    input_unscaled = np.array(last_sequence).reshape(-1, 1)
    input_scaled = scaler.transform(input_unscaled)
    
    lstm_input = input_scaled.reshape(1, len(last_sequence), 1)
    xgb_input = input_scaled.reshape(1, len(last_sequence))

    if model_choice == 'xgboost':
        m_xgb = joblib.load(f'saved_models/xgboost_prog_{prog_id}.pkl')
        predicted_scaled = m_xgb.predict(xgb_input)[0]
    elif model_choice == 'lstm':
        m_lstm = tf.keras.models.load_model(f'saved_models/lstm_prog_{prog_id}.keras')
        predicted_scaled = m_lstm.predict(lstm_input, verbose=0)[0][0]
    elif model_choice == 'ensemble':
        m_xgb = joblib.load(f'saved_models/xgboost_prog_{prog_id}.pkl')
        m_lstm = tf.keras.models.load_model(f'saved_models/lstm_prog_{prog_id}.keras')
        predicted_scaled = (m_xgb.predict(xgb_input)[0] + m_lstm.predict(lstm_input, verbose=0)[0][0]) / 2
    else:
        sys.exit(1)

    final_number = scaler.inverse_transform([[predicted_scaled]])[0][0]
    final_students = max(0, int(round(final_number)))

    save_to_database(prog_id, model_choice, target_year, final_students)
    print(f"SUCCESS: Predicted {final_students} students for year {target_year}.")

if __name__ == "__main__":
    run_prediction()