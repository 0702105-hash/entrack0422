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

# Lock path
current_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(current_dir)

load_dotenv(dotenv_path=r'C:\entrack\.env')

DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'user': os.getenv('DB_USERNAME', 'entrack_user'),
    'password': os.getenv('DB_PASSWORD', 'entrack123'),
    'database': os.getenv('DB_DATABASE', 'entrack')
}

def clean_environment():
    """Deletes old models and truncates predictions to start fresh"""
    model_dir = 'saved_models'
    if os.path.exists(model_dir):
        shutil.rmtree(model_dir)
    os.makedirs(model_dir, exist_ok=True)
    print("- Cleared /saved_models directory.")
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("TRUNCATE TABLE predictions")
        conn.commit()
        conn.close()
        print("- Successfully truncated prediction tables in database.")
    except Exception as e:
        print(f"- Note: Could not truncate tables: {e}")

def load_enrollment_data():
    conn = mysql.connector.connect(**DB_CONFIG)
    query = """
    SELECT program_id,
        academic_year_start,
        academic_year_end,
        CASE semester
            WHEN 'First' THEN 1
            WHEN 'Second' THEN 2
            WHEN 'Summer' THEN 3
        END AS semester,
        (male + female) AS total
    FROM enrollments
    ORDER BY program_id, academic_year_start, semester
    """
    df = pd.read_sql(query, conn)
    conn.close()
    return df

def train_and_save_all():
    print("=" * 50)
    print("STEP 1: CLEANING EXISTING DATA")
    print("=" * 50)
    clean_environment()
    
    print("\n" + "=" * 50)
    print("STEP 2: LOADING HISTORICAL DATA")
    print("=" * 50)
    df_hist = load_enrollment_data() 
    if df_hist.empty:
        return
    
    print(f"Loaded and normalized {len(df_hist)} historical records.")

    print("\n" + "=" * 50)
    print("STEP 3: TRAINING AI MODELS (SEEDING)")
    print("=" * 50)
    
    programs = df_hist['program_id'].unique()
    sequence_length = 3
    
    for prog_id in programs:
        print(f"Training 'Brains' for Program ID: {prog_id}...")
        prog_data = df_hist[df_hist['program_id'] == prog_id].sort_values(['academic_year_start', 'semester'])
        totals = prog_data['total'].values.astype(float)
        
        if len(totals) <= sequence_length:
            continue

        scaler = MinMaxScaler()
        totals_scaled = scaler.fit_transform(totals.reshape(-1, 1))
        
        X, y = [], []
        for i in range(len(totals_scaled) - sequence_length):
            X.append(totals_scaled[i : i + sequence_length])
            y.append(totals_scaled[i + sequence_length])
            
        X = np.array(X)
        y = np.array(y)

        # 1. Train XGBoost
        m_xgb = XGBRegressor(n_estimators=100, max_depth=3, learning_rate=0.05, random_state=42)
        m_xgb.fit(X.reshape(X.shape[0], X.shape[1]), y.ravel())
        joblib.dump(m_xgb, f'saved_models/xgboost_prog_{prog_id}.pkl')
        
        # 2. Train LSTM
        m_lstm = Sequential([
            LSTM(32, activation='relu', input_shape=(sequence_length, 1), recurrent_dropout=0.15),
            Dropout(0.20),
            Dense(8, activation='relu'),
            Dense(1)
        ])
        m_lstm.compile(optimizer=Adam(learning_rate=0.001), loss='huber')
        
        early_stop = EarlyStopping(monitor='loss', patience=10, restore_best_weights=True)
        m_lstm.fit(X, y, epochs=80, batch_size=4, verbose=0, callbacks=[early_stop])
        m_lstm.save(f'saved_models/lstm_prog_{prog_id}.keras')
        
        # 3. SAVE THE HISTORY STATE (CRITICAL FOR PREDICTIONS!)
        history_state = {
            'scaler': scaler,
            'last_sequence_unscaled': totals[-sequence_length:].tolist()
        }
        joblib.dump(history_state, f'saved_models/history_prog_{prog_id}.pkl')

    print("\nSUCCESS: All models trained and saved. Database reset. Ready for predictions!")

if __name__ == "__main__":
    train_and_save_all()