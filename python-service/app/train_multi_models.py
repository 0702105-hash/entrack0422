import os
import time
import warnings

import mysql.connector
import numpy as np
import pandas as pd

warnings.filterwarnings('ignore')

# Reduce TensorFlow startup noise and keep deterministic CPU behavior by default.
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '2')
os.environ.setdefault('TF_ENABLE_ONEDNN_OPTS', '0')

from prophet import Prophet
from .prediction_config import PROPHET_CONFIG
from sklearn.compose import TransformedTargetRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler, StandardScaler
import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.models import Sequential
from tensorflow.keras.optimizers import Adam
from xgboost import XGBRegressor

tf.get_logger().setLevel('ERROR')

print("=" * 80)
print("MULTI-MODEL ENROLLMENT PREDICTION SYSTEM (2026-2027 & 2027-2028)")
print("Models: Facebook Prophet | LSTM | XGBoost")
print("=" * 80)

DB_CONFIG = {
    "host": os.getenv("ML_DB_HOST", "127.0.0.1"),
    "user": os.getenv("ML_DB_USER", "root"),
    "password": os.getenv("ML_DB_PASSWORD", ""),
    "database": os.getenv("ML_DB_NAME", "entrack"),
    "port": int(os.getenv("ML_DB_PORT", "3306"))
}

PROGRAM_NAMES = {
    1: 'BA Communication',
    2: 'BA English',
    3: 'BA PolSci',
    4: 'BLIS',
    5: 'BM Music',
    6: 'BS Biology',
    7: 'BSIT',
    8: 'BS Social Work'
}
# Canonical ensemble label used everywhere (DB, API defaults, UI labels)
ENSEMBLE_LABEL = "Prophet+LSTM+XGBoost"
CONFIDENCE_MIN = 0.05
CONFIDENCE_MAX = 0.98

SEMESTER_MONTH_MAP = {
    1: 8,
    2: 1,
    3: 6
}

SEMESTER_ORDER = (1, 2, 3)
PROPHET_FREQ = '4MS'
PROPHET_CUSTOM_SEASONALITY = {
    'name': PROPHET_CONFIG.get('custom_seasonality_name', 'academic_cycle'),
    'period': float(PROPHET_CONFIG.get('custom_seasonality_period', 365.25)),
    'fourier_order': int(PROPHET_CONFIG.get('custom_seasonality_fourier_order', 3)),
    'prior_scale': float(PROPHET_CONFIG.get('custom_seasonality_prior_scale', 10.0))
}


def parse_academic_year_start(academic_year):
    try:
        return int(str(academic_year).split('-')[0])
    except (TypeError, ValueError, IndexError):
        return np.nan


def normalize_enrollment_history(df):
    if df is None or df.empty:
        return df

    normalized_source = df.copy()
    normalized_source['academic_year'] = normalized_source.apply(
        lambda row: f"{int(row['academic_year_start'])}-{int(row['academic_year_end'])}",
        axis=1
    )

    if 'male' not in normalized_source.columns:
        normalized_source['male'] = 0
    if 'female' not in normalized_source.columns:
        normalized_source['female'] = 0

    normalized_source['male'] = pd.to_numeric(normalized_source['male'], errors='coerce').fillna(0)
    normalized_source['female'] = pd.to_numeric(normalized_source['female'], errors='coerce').fillna(0)

    aggregated = normalized_source.groupby(
        ['program_id', 'academic_year', 'academic_year_start', 'semester'],
        as_index=False,
        dropna=False
    )[['male', 'female']].sum()
    aggregated['total'] = aggregated['male'] + aggregated['female']

    normalized_rows = []
    group_columns = ['program_id', 'academic_year', 'academic_year_start']
    for group_values, group_df in aggregated.groupby(group_columns, sort=False):
        program_id, academic_year, academic_year_start = group_values
        semester_lookup = group_df.set_index('semester')

        for semester in SEMESTER_ORDER:
            if semester in semester_lookup.index:
                row = semester_lookup.loc[semester]
                male = float(row['male'])
                female = float(row['female'])
                total = float(row['total'])
            else:
                male = 0.0
                female = 0.0
                total = 0.0

            normalized_rows.append({
                'program_id': int(program_id),
                'academic_year': academic_year,
                'academic_year_start': academic_year_start,
                'semester': int(semester),
                'male': male,
                'female': female,
                'total': total
            })

    normalized_df = pd.DataFrame(normalized_rows)
    normalized_df = normalized_df.sort_values(
        ['program_id', 'academic_year_start', 'semester', 'academic_year'],
        kind='mergesort'
    ).reset_index(drop=True)
    return normalized_df.drop(columns=['academic_year_start'])


def is_valid_metric_value(value):
    try:
        numeric_value = float(value)
        return np.isfinite(numeric_value)
    except (TypeError, ValueError):
        return False


def get_month_for_semester(semester):
    return int(SEMESTER_MONTH_MAP.get(int(semester), 1))


def make_temporal_feature_row(lag1_total, same_sem_last_year, semester, trend_index):
    month = get_month_for_semester(semester)
    sem_angle = 2.0 * np.pi * (float(semester) - 1.0) / 3.0
    month_angle = 2.0 * np.pi * (float(month) - 1.0) / 12.0

    return np.array([
        float(lag1_total),
        float(same_sem_last_year),
        float(np.sin(sem_angle)),
        float(np.cos(sem_angle)),
        float(np.sin(month_angle)),
        float(np.cos(month_angle)),
        float(trend_index)
    ], dtype=float)


def build_temporal_supervised(totals, semesters):
    totals = np.array(totals, dtype=float)
    semesters = np.array(semesters, dtype=int)

    if len(totals) != len(semesters):
        raise ValueError("Totals and semesters length mismatch")

    if len(totals) < 2:
        return np.array([]), np.array([]), np.array([])

    X_rows = []
    y_values = []
    target_indices = []

    last_seen_by_sem = {int(semesters[0]): float(totals[0])}

    for t in range(1, len(totals)):
        sem = int(semesters[t])
        lag1_total = float(totals[t - 1])
        same_sem_last_year = float(last_seen_by_sem.get(sem, lag1_total))

        X_rows.append(make_temporal_feature_row(
            lag1_total=lag1_total,
            same_sem_last_year=same_sem_last_year,
            semester=sem,
            trend_index=t
        ))
        y_values.append(float(totals[t]))
        target_indices.append(t)

        last_seen_by_sem[sem] = float(totals[t])

    return np.array(X_rows, dtype=float), np.array(y_values, dtype=float), np.array(target_indices, dtype=int)


def get_next_semester(current_semester):
    semester = int(current_semester)
    return 1 if semester == 3 else semester + 1


def build_forecast_semester_sequence(steps):
    return [SEMESTER_ORDER[index % len(SEMESTER_ORDER)] for index in range(int(steps))]


def build_last_seen_semester_map(semesters, totals):
    mapping = {}
    for sem, total in zip(np.array(semesters, dtype=int), np.array(totals, dtype=float)):
        mapping[int(sem)] = float(total)
    return mapping


class ModelEvaluator:
    @staticmethod
    def calculate_metrics(y_true, y_pred):
        y_true = np.array(y_true, dtype=float)
        y_pred_raw = np.array(y_pred, dtype=float)
        y_pred_clipped = np.maximum(y_pred_raw, 0)

        if len(y_true) == 0 or len(y_pred_raw) == 0:
            return {
                'MAE': np.nan,
                'RMSE': np.nan,
                'MAPE': np.nan,
                'MSE': np.nan,
                'R²': np.nan,
                'Raw_R2': np.nan,
                'Clipped_R2': np.nan,
                'RMSLE': np.nan,
                'Theil_U': np.nan,
                'Baseline_R2_Naive': np.nan
            }

        mae = mean_absolute_error(y_true, y_pred_raw)
        mse = mean_squared_error(y_true, y_pred_raw)
        rmse = np.sqrt(mse)

        mask = y_true != 0
        if mask.any():
            mape = np.mean(np.abs((y_true[mask] - y_pred_raw[mask]) / y_true[mask])) * 100
        else:
            mape = np.nan

        # R² is undefined when the ground-truth series has zero variance.
        if np.var(y_true) == 0:
            raw_r2 = np.nan
            clipped_r2 = np.nan
        else:
            try:
                raw_r2 = r2_score(y_true, y_pred_raw)
            except Exception:
                raw_r2 = np.nan
            try:
                clipped_r2 = r2_score(y_true, y_pred_clipped)
            except Exception:
                clipped_r2 = np.nan

        # Preserve historical key for downstream consumers; use raw model signal.
        r2 = raw_r2

        log_true = np.log1p(np.maximum(y_true, 0))
        log_pred = np.log1p(y_pred_clipped)
        rmsle = np.sqrt(mean_squared_error(log_true, log_pred))

        if len(y_true) > 1:
            naive_pred = y_true[:-1]
            naive_rmse = np.sqrt(mean_squared_error(y_true[1:], naive_pred))
            theil_u = rmse / naive_rmse if naive_rmse != 0 else np.nan

            # Time-series aware baseline: compare against one-step naive persistence.
            model_mse_vs_naive_window = mean_squared_error(y_true[1:], y_pred_raw[1:])
            naive_mse = mean_squared_error(y_true[1:], naive_pred)
            baseline_r2_naive = 1 - (model_mse_vs_naive_window / naive_mse) if naive_mse != 0 else np.nan
        else:
            theil_u = np.nan
            baseline_r2_naive = np.nan

        return {
            'MAE': round(float(mae), 2) if is_valid_metric_value(mae) else np.nan,
            'RMSE': round(float(rmse), 2) if is_valid_metric_value(rmse) else np.nan,
            'MAPE': round(float(mape), 2) if is_valid_metric_value(mape) else np.nan,
            'MSE': round(float(mse), 2) if is_valid_metric_value(mse) else np.nan,
            'R²': round(float(r2), 4) if is_valid_metric_value(r2) else np.nan,
            'Raw_R2': round(float(raw_r2), 4) if is_valid_metric_value(raw_r2) else np.nan,
            'Clipped_R2': round(float(clipped_r2), 4) if is_valid_metric_value(clipped_r2) else np.nan,
            'RMSLE': round(float(rmsle), 4) if is_valid_metric_value(rmsle) else np.nan,
            'Theil_U': round(float(theil_u), 4) if is_valid_metric_value(theil_u) else np.nan,
            'Baseline_R2_Naive': round(float(baseline_r2_naive), 4) if is_valid_metric_value(baseline_r2_naive) else np.nan
        }

    @staticmethod
    def print_metrics(metrics, model_name="Model"):
        print(f"\n   📊 {model_name} Evaluation Metrics:")
        for key, value in metrics.items():
            print(f"      {key:<16}: {value}")


class ProphetPredictor:
    def __init__(self, yearly_seasonality=PROPHET_CONFIG.get('yearly_seasonality', False), weekly_seasonality=PROPHET_CONFIG.get('weekly_seasonality', False), use_custom_seasonality=PROPHET_CONFIG.get('use_custom_seasonality', True)):
        self.yearly_seasonality = yearly_seasonality
        self.weekly_seasonality = weekly_seasonality
        self.use_custom_seasonality = use_custom_seasonality
        self.model = None
        self.metrics = {}
        self.validation_actual = None
        self.validation_predictions = None

    def _build_model(self, use_custom_seasonality=None):
        model = Prophet(
            yearly_seasonality=self.yearly_seasonality,
            weekly_seasonality=self.weekly_seasonality,
            interval_width=float(PROPHET_CONFIG.get('interval_width', 0.99)),
            changepoint_prior_scale=float(PROPHET_CONFIG.get('changepoint_prior_scale', 0.05)),
            seasonality_mode=PROPHET_CONFIG.get('seasonality_mode', 'additive'),
            seasonality_prior_scale=float(PROPHET_CONFIG.get('seasonality_prior_scale', 10.0))
        )

        if use_custom_seasonality is None:
            use_custom_seasonality = self.use_custom_seasonality

        if use_custom_seasonality:
            model.add_seasonality(
                name=PROPHET_CUSTOM_SEASONALITY['name'],
                period=PROPHET_CUSTOM_SEASONALITY['period'],
                fourier_order=PROPHET_CUSTOM_SEASONALITY['fourier_order'],
                prior_scale=PROPHET_CUSTOM_SEASONALITY['prior_scale']
            )

        return model

    def prepare_data(self, values):
        return pd.DataFrame({
            'ds': pd.date_range(start='2015-08-01', periods=len(values), freq=PROPHET_FREQ),
            'y': values
        })

    def train(self, y_train, y_test):
        print("      🔧 Training Prophet model...")
        try:
            train_df = self.prepare_data(y_train)
            try:
                self.model = self._build_model(use_custom_seasonality=self.use_custom_seasonality)
                self.model.fit(train_df)
            except ValueError as fit_error:
                if self.use_custom_seasonality and 'duplicate labels' in str(fit_error).lower():
                    print("      ⚠️  Prophet custom seasonality triggered duplicate-label reindexing; retrying without it")
                    self.model = self._build_model(use_custom_seasonality=False)
                    self.model.fit(train_df)
                else:
                    raise

            future = self.model.make_future_dataframe(periods=len(y_test), freq=PROPHET_FREQ)
            forecast = self.model.predict(future)
            predictions = forecast['yhat'].tail(len(y_test)).values

            self.validation_actual = np.array(y_test, dtype=float)
            self.validation_predictions = np.array(predictions, dtype=float)

            self.metrics = ModelEvaluator.calculate_metrics(y_test, predictions)

            mask = np.array(y_test) != 0
            if mask.any():
                mdape = np.median(
                    np.abs((np.array(y_test)[mask] - predictions[mask]) / np.array(y_test)[mask])
                ) * 100
                self.metrics['MdAPE'] = round(float(mdape), 2) if is_valid_metric_value(mdape) else np.nan
            else:
                self.metrics['MdAPE'] = np.nan

            return True
        except Exception as e:
            print(f"      ❌ Prophet training error: {str(e)}")
            return False

    def predict(self, steps=1):
        if self.model is None:
            return None

        try:
            future = self.model.make_future_dataframe(periods=steps, freq=PROPHET_FREQ)
            forecast = self.model.predict(future)

            predictions = forecast['yhat'].tail(steps).values
            lower_ci = forecast['yhat_lower'].tail(steps).values
            upper_ci = forecast['yhat_upper'].tail(steps).values

            return {
                'predictions': np.maximum(predictions, 0),
                'lower_ci': np.maximum(lower_ci, 0),
                'upper_ci': np.maximum(upper_ci, 0),
                'metrics': self.metrics
            }
        except Exception as e:
            print(f"      ❌ Prophet prediction error: {str(e)}")
            return None


class LSTMPredictor:
    def __init__(self, sequence_length=3, lstm_units=32, epochs=50, batch_size=4):
        self.sequence_length = sequence_length
        self.lstm_units = lstm_units
        self.epochs = epochs
        self.batch_size = batch_size
        self.model = None
        self.feature_scaler = StandardScaler()
        self.target_scaler = StandardScaler()
        self.metrics = {}
        self.validation_actual = None
        self.validation_predictions = None
        self.last_semester = None
        self.last_trend_index = None
        self.semester_last_value_map = {}

    def create_sequences(self, X_data, y_data):
        X, y, target_indices = [], [], []
        for i in range(len(X_data) - self.sequence_length + 1):
            target_pos = i + self.sequence_length - 1
            X.append(X_data[i:i + self.sequence_length])
            y.append(y_data[target_pos])
            target_indices.append(target_pos)
        return np.array(X), np.array(y), np.array(target_indices)

    def train(self, y_train, y_test, semesters_train, semesters_test):
        print("      🔧 Training LSTM model...")
        try:
            y_train_arr = np.array(y_train, dtype=float)
            y_test_arr = np.array(y_test, dtype=float)
            sem_train_arr = np.array(semesters_train, dtype=int)
            sem_test_arr = np.array(semesters_test, dtype=int)

            y_all = np.concatenate([y_train_arr, y_test_arr])
            sem_all = np.concatenate([sem_train_arr, sem_test_arr])

            X_rows, y_rows, target_indices = build_temporal_supervised(y_all, sem_all)
            if len(X_rows) < 2:
                print("      ⚠️  Insufficient data for LSTM")
                return False

            split_point = len(y_train_arr)
            train_mask = target_indices < split_point
            test_mask = target_indices >= split_point

            if train_mask.sum() < self.sequence_length + 1 or test_mask.sum() < 1:
                print("      ⚠️  Insufficient data for LSTM")
                return False

            X_train_rows = X_rows[train_mask]
            X_test_rows = X_rows[test_mask]

            self.feature_scaler.fit(X_train_rows)
            X_train_scaled_rows = self.feature_scaler.transform(X_train_rows)
            X_test_scaled_rows = self.feature_scaler.transform(X_test_rows)

            y_train_log = np.log1p(np.maximum(y_rows[train_mask], 0.0)).reshape(-1, 1)
            self.target_scaler.fit(y_train_log)
            y_train_scaled = self.target_scaler.transform(y_train_log).flatten()
            y_test_actual = y_rows[test_mask]

            X_train, y_train_seq, _ = self.create_sequences(X_train_scaled_rows, y_train_scaled)

            bridge_rows = np.vstack([X_train_scaled_rows[-(self.sequence_length - 1):], X_test_scaled_rows])
            X_test, _, _ = self.create_sequences(
                bridge_rows,
                np.zeros(len(bridge_rows), dtype=float)
            )
            X_test = X_test[:len(X_test_rows)]

            if len(X_train) < 2 or len(X_test) < 1:
                print("      ⚠️  Insufficient data for LSTM")
                return False

            n_features = int(X_train.shape[2])

            self.model = Sequential([
                LSTM(max(8, self.lstm_units // 2), input_shape=(self.sequence_length, n_features), recurrent_dropout=0.15),
                Dropout(0.20),
                Dense(8, activation='relu'),
                Dense(1)
            ])

            self.model.compile(optimizer=Adam(learning_rate=0.0008, clipnorm=1.0), loss='huber')

            callbacks = []
            if len(X_train) > 3:
                early_stop = EarlyStopping(
                    monitor='val_loss',
                    patience=8,
                    restore_best_weights=True
                )
                callbacks.append(early_stop)

            fit_kwargs = {
                'x': X_train,
                'y': y_train_seq,
                'epochs': self.epochs,
                'batch_size': self.batch_size,
                'callbacks': callbacks,
                'verbose': 0
            }

            if len(X_train) > 3:
                fit_kwargs['validation_split'] = 0.2

            history = self.model.fit(**fit_kwargs)

            predictions_scaled = self.model.predict(X_test, verbose=0).reshape(-1, 1)
            predictions_log = self.target_scaler.inverse_transform(predictions_scaled).flatten()
            predictions = np.expm1(predictions_log)

            self.validation_actual = np.array(y_test_actual, dtype=float)
            self.validation_predictions = np.array(predictions, dtype=float)

            self.metrics = ModelEvaluator.calculate_metrics(y_test_actual, predictions)

            train_loss = history.history['loss'][-1] if history.history.get('loss') else np.nan
            val_loss = history.history['val_loss'][-1] if history.history.get('val_loss') else np.nan

            self.metrics['Training_Loss'] = round(float(train_loss), 4) if is_valid_metric_value(train_loss) else np.nan
            self.metrics['Validation_Loss'] = round(float(val_loss), 4) if is_valid_metric_value(val_loss) else np.nan

            self.last_semester = int(sem_all[-1])
            self.last_trend_index = int(len(y_all) - 1)
            self.semester_last_value_map = build_last_seen_semester_map(sem_all, y_all)

            return True
        except Exception as e:
            print(f"      ❌ LSTM training error: {str(e)}")
            return False

    def predict(self, y_hist, semester_hist, steps=1, forecast_semesters=None):
        if self.model is None:
            return None

        try:
            history_totals = list(np.array(y_hist, dtype=float))
            history_semesters = list(np.array(semester_hist, dtype=int))
            if len(history_totals) < self.sequence_length:
                print("      ⚠️  Not enough history for LSTM prediction")
                return None

            forecast_semesters = list(forecast_semesters or build_forecast_semester_sequence(steps))
            if len(forecast_semesters) < int(steps):
                forecast_semesters.extend(build_forecast_semester_sequence(int(steps) - len(forecast_semesters)))

            sem_last_map = dict(self.semester_last_value_map)
            current_trend = int(self.last_trend_index if self.last_trend_index is not None else len(history_totals) - 1)

            latest_rows = []
            for idx in range(len(history_totals) - self.sequence_length + 1, len(history_totals)):
                sem = int(history_semesters[idx])
                lag1 = float(history_totals[idx - 1])
                same_sem = float(sem_last_map.get(sem, lag1))
                latest_rows.append(make_temporal_feature_row(lag1, same_sem, sem, idx))
                sem_last_map[sem] = float(history_totals[idx])

            scaled_seed_rows = self.feature_scaler.transform(np.array(latest_rows, dtype=float))
            current_seq = scaled_seed_rows.reshape(1, self.sequence_length - 1, -1)

            predictions = []

            for step_index in range(int(steps)):
                next_sem = int(forecast_semesters[step_index])
                next_trend = current_trend + 1
                lag1 = float(history_totals[-1])
                same_sem = float(sem_last_map.get(next_sem, lag1))

                next_row = make_temporal_feature_row(lag1, same_sem, next_sem, next_trend)
                next_row_scaled = self.feature_scaler.transform(next_row.reshape(1, -1))[0]

                full_seq = np.vstack([current_seq[0], next_row_scaled]).reshape(1, self.sequence_length, -1)
                pred_scaled = float(self.model.predict(full_seq, verbose=0)[0, 0])
                pred_log = float(self.target_scaler.inverse_transform(np.array([[pred_scaled]], dtype=float))[0, 0])
                pred_value = max(float(np.expm1(pred_log)), 0.0)
                predictions.append(pred_value)

                history_totals.append(pred_value)
                history_semesters.append(next_sem)
                sem_last_map[next_sem] = pred_value
                current_trend = next_trend

                current_seq = np.vstack([current_seq[0][1:], next_row_scaled]).reshape(1, self.sequence_length - 1, -1)

            return {
                'predictions': np.array(predictions, dtype=float),
                'lower_ci': None,
                'upper_ci': None,
                'metrics': self.metrics
            }
        except Exception as e:
            print(f"      ❌ LSTM prediction error: {str(e)}")
            return None


class XGBoostPredictor:
    def __init__(self, n_lags=3):
        self.n_lags = n_lags
        self.model = None
        self.metrics = {}
        self.history_values = None
        self.validation_actual = None
        self.validation_predictions = None
        self.last_semester = None
        self.last_trend_index = None
        self.semester_last_value_map = {}
        self.xgb_params = {
            'n_estimators': 100,
            'max_depth': 3,
            'learning_rate': 0.05,
            'subsample': 0.9,
            'colsample_bytree': 0.9,
            'objective': 'reg:squarederror',
            'random_state': 42
        }

    def build_model(self):
        # Scales lag features and applies log1p target transform to reduce negative predictions.
        reg_pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('xgb', XGBRegressor(**self.xgb_params))
        ])
        return TransformedTargetRegressor(
            regressor=reg_pipeline,
            func=np.log1p,
            inverse_func=np.expm1,
            check_inverse=False
        )

    def train(self, y_train, y_test, semesters_train, semesters_test):
        print("      🔧 Training XGBoost model...")
        try:
            y_train_arr = np.array(y_train, dtype=float)
            y_test_arr = np.array(y_test, dtype=float)
            sem_train_arr = np.array(semesters_train, dtype=int)
            sem_test_arr = np.array(semesters_test, dtype=int)

            full_series = np.concatenate([y_train_arr, y_test_arr]).astype(float)
            full_semesters = np.concatenate([sem_train_arr, sem_test_arr]).astype(int)

            X_rows, y_rows, target_indices = build_temporal_supervised(full_series, full_semesters)
            if len(X_rows) < 2:
                print("      ⚠️  Insufficient data for final XGBoost fit")
                return False

            split_point = len(y_train_arr)
            train_mask = target_indices < split_point
            test_mask = target_indices >= split_point

            if train_mask.sum() < 2 or test_mask.sum() < 1:
                print("      ⚠️  Insufficient data for XGBoost")
                return False

            X_train = X_rows[train_mask]
            y_train_supervised = y_rows[train_mask]
            X_test = X_rows[test_mask]
            y_test_supervised = y_rows[test_mask]

            validate_model = self.build_model()
            validate_model.fit(X_train, y_train_supervised)
            test_predictions = validate_model.predict(X_test)

            self.metrics = ModelEvaluator.calculate_metrics(y_test_supervised, np.array(test_predictions, dtype=float))
            self.validation_actual = np.array(y_test_supervised, dtype=float)
            self.validation_predictions = np.array(test_predictions, dtype=float)
            self.history_values = full_series.copy()

            self.model = self.build_model()
            self.model.fit(X_rows, y_rows)

            self.last_semester = int(full_semesters[-1])
            self.last_trend_index = int(len(full_series) - 1)
            self.semester_last_value_map = build_last_seen_semester_map(full_semesters, full_series)

            return True

        except Exception as e:
            print(f"      ❌ XGBoost training error: {str(e)}")
            return False

    def predict(self, y_hist, semester_hist, steps=1, forecast_semesters=None):
        if self.model is None:
            return None

        try:
            history_totals = list(np.array(y_hist, dtype=float))
            history_semesters = list(np.array(semester_hist, dtype=int))
            if len(history_totals) < 2:
                return None

            forecast_semesters = list(forecast_semesters or build_forecast_semester_sequence(steps))
            if len(forecast_semesters) < int(steps):
                forecast_semesters.extend(build_forecast_semester_sequence(int(steps) - len(forecast_semesters)))

            sem_last_map = dict(self.semester_last_value_map)
            current_trend = int(self.last_trend_index if self.last_trend_index is not None else len(history_totals) - 1)

            predictions = []
            for step_index in range(int(steps)):
                next_sem = int(forecast_semesters[step_index])
                next_trend = current_trend + 1
                lag1 = float(history_totals[-1])
                same_sem = float(sem_last_map.get(next_sem, lag1))

                x_input = make_temporal_feature_row(lag1, same_sem, next_sem, next_trend).reshape(1, -1)
                pred = self.model.predict(x_input)[0]
                pred = max(float(pred), 0)
                predictions.append(pred)

                history_totals.append(pred)
                history_semesters.append(next_sem)
                sem_last_map[next_sem] = pred
                current_trend = next_trend

            return {
                'predictions': np.array(predictions, dtype=float),
                'lower_ci': None,
                'upper_ci': None,
                'metrics': self.metrics
            }
        except Exception as e:
            print(f"      ❌ XGBoost prediction error: {str(e)}")
            return None


def load_enrollment_data():
    print("\n📂 Loading historical data...")
    started = time.perf_counter()

    conn = mysql.connector.connect(**DB_CONFIG)
    try:
        df = pd.read_sql("""
            SELECT program_id,
                academic_year_start,
                academic_year_end,
                CASE semester
                    WHEN 'First' THEN 1
                    WHEN 'Second' THEN 2
                    WHEN 'Summer' THEN 3
                END AS semester,
                male,
                female,
                (male + female) AS total
            FROM enrollments
            ORDER BY program_id, academic_year_start, academic_year_end, semester
        """, conn)
    finally:
        conn.close()

    if df.empty:
        print("❌ No historical enrollment data found!")
        return None

    df['academic_year'] = df.apply(
        lambda row: f"{int(row['academic_year_start'])}-{int(row['academic_year_end'])}",
        axis=1
    )
    
    df = normalize_enrollment_history(df)

    print(f"Loaded {len(df)} records from {df['program_id'].nunique()} programs in {time.perf_counter() - started:.2f}s")
    return df


def build_gender_ratio_map(df_hist):
    ratio_map = {}
    grouped = df_hist.groupby('program_id')[['male', 'female']].sum().reset_index()

    for _, row in grouped.iterrows():
        total_male = float(row['male'])
        total_female = float(row['female'])
        total_all = total_male + total_female
        ratio_map[int(row['program_id'])] = (total_male / total_all) if total_all > 0 else 0.5

    return ratio_map


def clip_value(value, min_value=0.0, max_value=1.0):
    return float(np.clip(float(value), float(min_value), float(max_value)))


def score_r2(r2_value):
    if not is_valid_metric_value(r2_value):
        return None

    # Normalize R² from [-1, 1] to [0, 1] while clipping outliers.
    clipped_r2 = clip_value(r2_value, -1.0, 1.0)
    return (clipped_r2 + 1.0) / 2.0


def score_mape(mape_value):
    if not is_valid_metric_value(mape_value):
        return None

    mape = max(float(mape_value), 0.0)
    if mape <= 5:
        return 1.0
    if mape <= 10:
        return 0.9
    if mape <= 20:
        return 0.75
    if mape <= 30:
        return 0.6
    if mape <= 50:
        return 0.4
    if mape <= 100:
        return 0.2
    return 0.05


def score_theil_u(theil_u_value):
    if not is_valid_metric_value(theil_u_value):
        return None

    theil_u = max(float(theil_u_value), 0.0)
    if theil_u <= 0.5:
        return 1.0
    if theil_u <= 1.0:
        return 0.8
    if theil_u <= 1.5:
        return 0.6
    if theil_u <= 2.0:
        return 0.4
    if theil_u <= 3.0:
        return 0.25
    return 0.1


def get_model_quality_score(model_result):
    if not model_result or not model_result.get('metrics'):
        return 0.5

    metrics = model_result['metrics']
    weighted_scores = []
    total_weight = 0.0

    metric_components = [
        ('Raw_R2', 0.45, score_r2),
        ('MAPE', 0.35, score_mape),
        ('Theil_U', 0.20, score_theil_u)
    ]

    for metric_name, weight, scorer in metric_components:
        metric_value = metrics.get(metric_name)
        if metric_name == 'Raw_R2' and metric_value is None:
            metric_value = metrics.get('R²')

        score = scorer(metric_value)
        if score is None:
            continue
        weighted_scores.append(score * weight)
        total_weight += weight

    if total_weight == 0:
        return 0.5

    quality_score = sum(weighted_scores) / total_weight
    return clip_value(quality_score, CONFIDENCE_MIN, CONFIDENCE_MAX)


def calculate_ensemble_weights(model_outputs):
    scored_models = []

    for model_key, model_result in model_outputs:
        if not model_result or model_result.get('predictions') is None:
            continue

        quality = get_model_quality_score(model_result)
        bonus = 1.0
        metrics = model_result.get('metrics') or {}
        raw_r2 = metrics.get('Raw_R2', metrics.get('R²'))

        if model_key == 'xgboost':
            bonus = 1.10
            if raw_r2 is not None and is_valid_metric_value(raw_r2) and float(raw_r2) > 0:
                bonus += 0.15
        elif model_key == 'lstm':
            bonus = 0.10

        scored_models.append((model_key, max(float(quality) * bonus, 0.01)))

    if not scored_models:
        return [], []

    raw_scores = np.array([score for _, score in scored_models], dtype=float)
    model_keys = [key for key, _ in scored_models]

    if len(raw_scores) == 1:
        return model_keys, [1.0]

    # Sharpen weight differences so the strongest model dominates when it is clearly better.
    temperature = 0.60
    stabilized = raw_scores / max(temperature, 1e-6)
    stabilized = stabilized - np.max(stabilized)
    exp_scores = np.exp(stabilized)
    weights = exp_scores / np.sum(exp_scores)

    xgb_index = model_keys.index('xgboost') if 'xgboost' in model_keys else None
    if xgb_index is not None:
        best_idx = int(np.argmax(raw_scores))
        second_best = np.partition(raw_scores, -2)[-2] if len(raw_scores) > 1 else raw_scores[0]
        if best_idx == xgb_index and (raw_scores[xgb_index] - second_best) >= 0.05:
            weights = weights * 0.85
            weights[xgb_index] += 0.15
            weights = weights / np.sum(weights)

    return model_keys, weights.tolist()


def get_prediction_stability(pred_result):
    first_step_predictions = []

    for key in ['prophet', 'lstm', 'xgboost']:
        model_result = pred_result.get(key)
        if not model_result or model_result.get('predictions') is None:
            continue

        preds = np.array(model_result['predictions'], dtype=float)
        if len(preds) > 0 and np.isfinite(preds[0]):
            first_step_predictions.append(float(preds[0]))

    if len(first_step_predictions) < 2:
        return 0.85

    preds = np.array(first_step_predictions, dtype=float)
    spread = np.std(preds)
    scale = max(np.mean(np.abs(preds)), 1.0)
    coeff_var = spread / scale

    # Lower disagreement across models increases confidence.
    stability = 1.0 / (1.0 + 2.0 * coeff_var)
    return clip_value(stability, 0.35, 1.0)


def get_model_confidence(pred_result):
    quality_scores = []

    for key in ['prophet', 'lstm', 'xgboost']:
        model_result = pred_result.get(key)
        if model_result and model_result.get('metrics'):
            quality_scores.append(get_model_quality_score(model_result))

    if not quality_scores:
        return 0.5

    base_quality = float(np.mean(quality_scores))
    stability = get_prediction_stability(pred_result)

    # Blend quality (validation metrics) with cross-model agreement.
    confidence = 0.20 + (base_quality * (0.60 + 0.40 * stability))
    return clip_value(confidence, CONFIDENCE_MIN, CONFIDENCE_MAX)


def predict_for_program(program_id, program_data, future_years=1):
    print(f"\n{'=' * 60}")
    print(f"📚 Program {program_id}: {PROGRAM_NAMES.get(program_id, 'Unknown')}")
    print(f"{'=' * 60}")

    program_data = program_data.sort_values(['academic_year', 'semester']).reset_index(drop=True)

    if len(program_data) < 5:
        print(f"⚠️  Insufficient historical data ({len(program_data)} points)")
        return None

    y = program_data['total'].values.astype(float)
    semesters = program_data['semester'].values.astype(int)

    train_y_all = y
    train_semesters = semesters

    split_idx = int(len(train_y_all) * 0.8)
    y_train = train_y_all[:split_idx]
    y_test = train_y_all[split_idx:]
    sem_train = train_semesters[:split_idx]
    sem_test = train_semesters[split_idx:]

    print("\n   📊 Data Summary:")
    print(f"      Total points: {len(y)} | Train: {len(y_train)} | Test: {len(y_test)}")
    print(f"      Min: {y.min():.0f} | Max: {y.max():.0f} | Mean: {y.mean():.0f}")

    steps = future_years * 3
    forecast_semesters = build_forecast_semester_sequence(steps)

    print("\n   🔮 MODEL 1: Facebook Prophet")
    prophet_predictor = ProphetPredictor()
    prophet_success = prophet_predictor.train(y_train, y_test)
    prophet_pred = prophet_predictor.predict(steps=steps) if prophet_success else None
    if prophet_pred and prophet_pred.get('metrics'):
        ModelEvaluator.print_metrics(prophet_pred['metrics'], "Prophet")

    print("\n   🔮 MODEL 2: LSTM (Neural Network)")
    lstm_seq_len = min(4, max(2, len(y_train) // 5 if len(y_train) >= 5 else 2))
    lstm_units = 16 if len(y_train) < 20 else 24
    lstm_epochs = 60 if len(y_train) < 20 else 80
    lstm_predictor = LSTMPredictor(sequence_length=lstm_seq_len, lstm_units=lstm_units, epochs=lstm_epochs, batch_size=4)
    lstm_success = lstm_predictor.train(y_train, y_test, sem_train, sem_test)
    lstm_pred = lstm_predictor.predict(y, semesters, steps=steps, forecast_semesters=forecast_semesters) if lstm_success else None
    if lstm_pred and lstm_pred.get('metrics'):
        ModelEvaluator.print_metrics(lstm_pred['metrics'], "LSTM")

    print("\n   🔮 MODEL 3: XGBoost")
    xgb_predictor = XGBoostPredictor(n_lags=min(3, max(1, len(y_train) - 1)))
    xgb_success = xgb_predictor.train(y_train, y_test, sem_train, sem_test)
    xgb_pred = xgb_predictor.predict(y, semesters, steps=steps, forecast_semesters=forecast_semesters) if xgb_success else None
    if xgb_pred and xgb_pred.get('metrics'):
        ModelEvaluator.print_metrics(xgb_pred['metrics'], "XGBoost")

    model_outputs = [
        ('prophet', prophet_pred),
        ('lstm', lstm_pred),
        ('xgboost', xgb_pred)
    ]

    valid_models, model_weights = calculate_ensemble_weights(model_outputs)
    weighted_predictions = [np.array(model_outputs[[key for key, _ in model_outputs].index(model_key)][1]['predictions'], dtype=float)
                            for model_key in valid_models]

    valid_predictions = weighted_predictions

    if not valid_predictions:
        print("      ❌ No valid predictions from any model")
        return None

    if len(valid_predictions) == 1:
        ensemble_pred = valid_predictions[0]
    else:
        stacked_predictions = np.vstack(valid_predictions)
        ensemble_pred = np.average(stacked_predictions, axis=0, weights=np.array(model_weights, dtype=float))

    weights_text = ", ".join(
        f"{model_name}={weight:.2f}" for model_name, weight in zip(valid_models, model_weights)
    )
    print(f"   ⚖️ Ensemble weights: {weights_text}")

    predictor_by_key = {
        'prophet': prophet_predictor,
        'lstm': lstm_predictor,
        'xgboost': xgb_predictor
    }

    val_actual = None
    val_prediction_rows = []
    val_weights = []

    for model_key, weight in zip(valid_models, model_weights):
        predictor = predictor_by_key.get(model_key)
        if predictor is None:
            continue

        actual = predictor.validation_actual
        predicted = predictor.validation_predictions
        if actual is None or predicted is None:
            continue
        if len(actual) == 0 or len(predicted) == 0:
            continue

        if val_actual is None:
            val_actual = np.array(actual, dtype=float)

        common_len = min(len(val_actual), len(actual), len(predicted))
        if common_len < 1:
            continue

        val_actual = val_actual[-common_len:]
        val_prediction_rows = [row[-common_len:] for row in val_prediction_rows]
        val_prediction_rows.append(np.array(predicted, dtype=float)[-common_len:])
        val_weights.append(float(weight))

    ensemble_metrics = {}
    if val_actual is not None and val_prediction_rows:
        val_matrix = np.vstack(val_prediction_rows)
        ensemble_val_pred = np.average(val_matrix, axis=0, weights=np.array(val_weights, dtype=float))
        ensemble_metrics = ModelEvaluator.calculate_metrics(val_actual, ensemble_val_pred)

    program_confidence = get_model_confidence({
        'prophet': prophet_pred,
        'lstm': lstm_pred,
        'xgboost': xgb_pred
    })
    ensemble_metrics['Confidence'] = round(float(program_confidence), 4)

    return {
        'program_id': program_id,
        'program_name': PROGRAM_NAMES.get(program_id, f'Program {program_id}'),
        'prophet': prophet_pred,
        'lstm': lstm_pred,
        'xgboost': xgb_pred,
        'ensemble': {
            'predictions': np.maximum(ensemble_pred, 0),
            'lower_ci': None,
            'upper_ci': None,
            'metrics': ensemble_metrics
        },
        'future_years': future_years
    }


def get_table_columns(cursor, table_name):
    cursor.execute("""
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = %s
    """, (table_name,))
    return {row[0] for row in cursor.fetchall()}


def _unique_index_columns(index_map_entry):
    """
    index_map_entry: dict with keys: non_unique, columns (seq -> column_name)
    returns ordered list of column names
    """
    ordered_cols = [index_map_entry['columns'][k] for k in sorted(index_map_entry['columns'])]
    return ordered_cols


SEMESTER_LABELS = {1: "First", 2: "Second", 3: "Summer"}

def get_or_create_mlmodel(cursor, model_name):
    cursor.execute("SELECT mlmodel_id FROM mlmodels WHERE mlmodel_name = %s", (model_name,))
    row = cursor.fetchone()
    if row:
        return int(row[0])
    cursor.execute(
        "INSERT INTO mlmodels (mlmodel_name, created_at, updated_at) VALUES (%s, NOW(), NOW())",
        (model_name,)
    )
    return int(cursor.lastrowid)

def get_or_create_enrollment_batch(cursor, program_id, year_start, year_end, semester_label, total_male, total_female):
    cursor.execute("""
        SELECT enrollment_batch_id
        FROM enrollment_batches
        WHERE program_id = %s
          AND selected_year_start = %s
          AND selected_year_end = %s
          AND selected_semester = %s
        LIMIT 1
    """, (program_id, year_start, year_end, semester_label))
    row = cursor.fetchone()
    if row:
        batch_id = int(row[0])
        cursor.execute("""
            UPDATE enrollment_batches
            SET total_male = %s,
                total_female = %s,
                updated_at = NOW()
            WHERE enrollment_batch_id = %s
        """, (total_male, total_female, batch_id))
        return batch_id

    cursor.execute("""
        INSERT INTO enrollment_batches
        (program_id, selected_year_start, selected_year_end, selected_semester, total_male, total_female, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
    """, (program_id, year_start, year_end, semester_label, total_male, total_female))
    return int(cursor.lastrowid)

def extract_metrics(model_result):
    metrics = model_result.get('metrics') or {}
    return {
        'mae_value': float(metrics.get('MAE', 0.0)),
        'rmse_value': float(metrics.get('RMSE', 0.0)),
        'mape_value': float(metrics.get('MAPE', 0.0)),
        'rsquared_value': float(metrics.get('R²', metrics.get('Raw_R2', 0.0))),
    }

def clear_existing_predictions(cursor, year_start, year_end):
    cursor.execute("""
        SELECT p.predictions_id
        FROM predictions p
        JOIN enrollment_batches b ON p.enrollment_batch_id = b.enrollment_batch_id
        WHERE b.selected_year_start = %s AND b.selected_year_end = %s
    """, (year_start, year_end))
    ids = [row[0] for row in cursor.fetchall()]

    if ids:
        format_ids = ",".join(["%s"] * len(ids))
        cursor.execute(f"DELETE FROM model_metrics WHERE predictions_id IN ({format_ids})", ids)
        cursor.execute(f"DELETE FROM predictions WHERE predictions_id IN ({format_ids})", ids)

def save_predictions_to_db(all_predictions, future_years=1, base_year=2026, gender_ratio_map=None):
    gender_ratio_map = gender_ratio_map or {}
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        year_start = base_year
        year_end = base_year + 1
        clear_existing_predictions(cursor, year_start, year_end)

        inserted = 0

        for pred_result in all_predictions:
            if pred_result is None:
                continue

            program_id = int(pred_result['program_id'])
            avg_male_ratio = float(gender_ratio_map.get(program_id, 0.5))

            model_map = {
                'Prophet': pred_result.get('prophet'),
                'LSTM': pred_result.get('lstm'),
                'XGBoost': pred_result.get('xgboost'),
                'Ensemble': pred_result.get('ensemble')
            }

            for model_name, model_result in model_map.items():
                if not model_result or model_result.get('predictions') is None:
                    continue

                mlmodel_id = get_or_create_mlmodel(cursor, model_name)
                metrics = extract_metrics(model_result)

                predictions = model_result['predictions'][:future_years * 3]
                forecast_semesters = build_forecast_semester_sequence(len(predictions))

                for sem_offset, pred_value in enumerate(predictions):
                    semester_num = int(forecast_semesters[sem_offset])
                    semester_label = SEMESTER_LABELS.get(semester_num, "First")

                    pred_total = int(max(float(pred_value), 0))
                    pred_male = int(round(pred_total * avg_male_ratio))
                    pred_female = int(pred_total - pred_male)

                    enrollment_batch_id = get_or_create_enrollment_batch(
                        cursor,
                        program_id=program_id,
                        year_start=year_start,
                        year_end=year_end,
                        semester_label=semester_label,
                        total_male=pred_male,
                        total_female=pred_female
                    )

                    cursor.execute("""
                        INSERT INTO predictions
                        (enrollment_batch_id, predicted_total, predicted_male, predicted_female, confidence, mlmodel_id, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                    """, (
                        enrollment_batch_id,
                        pred_total,
                        pred_male,
                        pred_female,
                        float(get_model_confidence(pred_result)),
                        mlmodel_id
                    ))
                    prediction_id = cursor.lastrowid

                    cursor.execute("""
                        INSERT INTO model_metrics
                        (predictions_id, mae_value, rmse_value, mape_value, rsquared_value, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                    """, (
                        prediction_id,
                        metrics['mae_value'],
                        metrics['rmse_value'],
                        metrics['mape_value'],
                        metrics['rsquared_value']
                    ))

                    inserted += 1

        conn.commit()
        print(f"✅ Saved {inserted} prediction rows for AY {year_start}-{year_end}")

    except Exception as e:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()
    
if __name__ == "__main__":
    total_started = time.perf_counter()

    df_hist = load_enrollment_data()
    if df_hist is None:
        exit(1)

    future_years = 1
    base_year = 2026
    gender_ratio_map = build_gender_ratio_map(df_hist)

    all_predictions = []
    for program_id in sorted(df_hist['program_id'].unique()):
        program_data = df_hist[df_hist['program_id'] == program_id].copy()
        result = predict_for_program(program_id, program_data, future_years=future_years)
        all_predictions.append(result)

    save_predictions_to_db(
        all_predictions,
        future_years=future_years,
        base_year=base_year,
        gender_ratio_map=gender_ratio_map
    )

    successful = sum(1 for p in all_predictions if p is not None)
    print(f"\n✅ {successful}/{len(all_predictions)} programs processed successfully")
    print(f"⏱️ Total runtime: {time.perf_counter() - total_started:.2f}s")