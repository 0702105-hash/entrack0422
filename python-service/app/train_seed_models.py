import os
import shutil
import joblib
import warnings
import numpy as np
import pandas as pd
import tensorflow as tf
import mysql.connector
from dotenv import load_dotenv

from xgboost import XGBRegressor
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping

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

def clean_environment():
    model_dir = 'saved_models'
    if os.path.exists(model_dir):
        shutil.rmtree(model_dir)
    os.makedirs(model_dir, exist_ok=True)
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("TRUNCATE TABLE predictions")
        conn.commit()
        conn.close()
    except Exception as e:
        pass

def load_enrollment_data():
    """THE FIX: Using your exact JOIN to link programs with enrollments"""
    conn = mysql.connector.connect(**DB_CONFIG)
    query = """
    SELECT p.program_id,
        p.program_name,
        e.academic_year_start,
        e.academic_year_end,
        CASE e.semester
            WHEN 'First' THEN 1
            WHEN 'Second' THEN 2
            WHEN 'Summer' THEN 3
            ELSE 1
        END AS semester,
        (e.male + e.female) AS total
    FROM programs p
    JOIN enrollments e ON p.program_id = e.program_id
    ORDER BY p.program_id, e.academic_year_start, semester
    """
    df = pd.read_sql(query, conn)
    conn.close()
    return df

def train_and_save_all():
    print("STEP 1: CLEANING EXISTING DATA")
    clean_environment()
    
    print("\nSTEP 2: LOADING HISTORICAL DATA")
    df_hist = load_enrollment_data() 
    if df_hist.empty:
        print("CRITICAL: No data found. Make sure your CSV uploaded successfully!")
        return
    print(f"Loaded {len(df_hist)} historical records.")

    print("\nSTEP 3: TRAINING AI MODELS")
    programs = df_hist['program_id'].unique()
    sequence_length = 3
    
    for prog_id in programs:
        print(f"Training 'Brains' for Program ID: {prog_id}...")
        prog_data = df_hist[df_hist['program_id'] == prog_id].sort_values(['academic_year_start', 'semester'])
        totals = prog_data['total'].values.astype(float)

        if len(totals) <= sequence_length:
            print(f"  Skipping program {prog_id}: not enough data ({len(totals)} rows, need > {sequence_length})")
            continue

        scaler = MinMaxScaler()
        totals_scaled = scaler.fit_transform(totals.reshape(-1, 1))

        X, y = [], []
        for i in range(len(totals_scaled) - sequence_length):
            X.append(totals_scaled[i : i + sequence_length])
            y.append(totals_scaled[i + sequence_length])

        X = np.array(X)
        y = np.array(y)

        # --- XGBoost (already works fine) ---
        m_xgb = XGBRegressor(n_estimators=100, max_depth=3, learning_rate=0.05, random_state=42)
        m_xgb.fit(X.reshape(X.shape[0], X.shape[1]), y.ravel())
        joblib.dump(m_xgb, f'saved_models/xgboost_prog_{prog_id}.pkl')

        # --- LSTM (needs the guard) ---
        # Need at least batch_size + 1 samples for a meaningful fit
        min_lstm_samples = 5  # safe floor: more than batch_size=4
        if len(X) < min_lstm_samples:
            print(f"  Skipping LSTM for program {prog_id}: only {len(X)} training samples (need >= {min_lstm_samples}). Falling back to XGBoost-only.")
            # Save history state so predict_fast.py still works via XGBoost
            history_state = {
                'scaler': scaler,
                'last_sequence_unscaled': totals[-sequence_length:].tolist()
            }
            joblib.dump(history_state, f'saved_models/history_prog_{prog_id}.pkl')
            continue

        try:
            # Shrink batch_size when dataset is small so Keras doesn't choke
            effective_batch = min(4, max(1, len(X) // 2))

            m_lstm = Sequential([
                LSTM(32, activation='relu', input_shape=(sequence_length, 1), recurrent_dropout=0.15),
                Dropout(0.20),
                Dense(8, activation='relu'),
                Dense(1)
            ])
            m_lstm.compile(optimizer=Adam(learning_rate=0.001), loss='huber')

            early_stop = EarlyStopping(monitor='loss', patience=10, restore_best_weights=True)
            m_lstm.fit(X, y, epochs=80, batch_size=effective_batch, verbose=0, callbacks=[early_stop])
            m_lstm.save(f'saved_models/lstm_prog_{prog_id}.keras')
            print(f"  LSTM saved for program {prog_id}.")

        except Exception as e:
            print(f"  WARNING: LSTM training failed for program {prog_id}: {e}")
            print(f"  Program {prog_id} will use XGBoost-only predictions.")
            # Don't crash the whole loop — other programs still get trained

        history_state = {
            'scaler': scaler,
            'last_sequence_unscaled': totals[-sequence_length:].tolist()
        }
        joblib.dump(history_state, f'saved_models/history_prog_{prog_id}.pkl')
        print("\nSUCCESS: All models trained. Ready for predictions!")

if __name__ == "__main__":
    train_and_save_all()