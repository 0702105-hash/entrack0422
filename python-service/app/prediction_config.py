"""
Configuration file for multi-model prediction system
Allows easy customization of prediction parameters
"""

# ============ PREDICTION CONFIGURATION ============

# Number of years to predict into the future
FUTURE_YEARS = 1  # Set to 2, 3, etc. for multi-year predictions

# ============ SARMAX CONFIGURATION ============
SARMAX_CONFIG = {
    'order': (1, 1, 1),           # (p, d, q) - AR, differencing, MA
    'seasonal_order': (1, 1, 1, 3), # (P, D, Q, s) - seasonal parameters, s=3 for semesters
    'enforce_stationarity': False,
    'enforce_invertibility': False,
    'maxiter': 500
}

# ============ PROPHET CONFIGURATION ============
PROPHET_CONFIG = {
    'yearly_seasonality': False,   # Built-in annual pattern; custom seasonality is used instead
    'weekly_seasonality': False,   # Weekly patterns (usually False for academic data)
    'interval_width': 0.99,        # 99% confidence interval
    'changepoint_prior_scale': 0.05,  # Sensitivity to trend changes
    'seasonality_mode': 'additive', # or 'multiplicative'
    'seasonality_prior_scale': 10.0,
    'use_custom_seasonality': True,
    'custom_seasonality_name': 'academic_cycle',
    'custom_seasonality_period': 365.25,
    'custom_seasonality_fourier_order': 3,
    'custom_seasonality_prior_scale': 10.0
}

# ============ LSTM CONFIGURATION ============
LSTM_CONFIG = {
    'sequence_length': 4,          # Number of past timesteps to use
    'lstm_units': 32,              # Number of LSTM cells
    'dropout_rate': 0.2,           # Dropout for regularization
    'dense_units': 16,             # Hidden dense layer units
    'epochs': 100,                 # Training epochs
    'batch_size': 8,               # Batch size
    'learning_rate': 0.001,        # Adam optimizer learning rate
    'validation_split': 0.2,       # Train/val split
    'early_stopping_patience': 10  # Early stopping patience
}

# ============ ENSEMBLE CONFIGURATION ============
ENSEMBLE_CONFIG = {
    'method': 'mean',              # 'mean', 'weighted_mean', 'median'
    'weights': {                   # Used for weighted_mean
        'sarmax': 0.33,
        'prophet': 0.33,
        'lstm': 0.34
    }
}

# ============ EVALUATION METRICS ============
# Metrics automatically calculated:
# - MAE (Mean Absolute Error)
# - RMSE (Root Mean Squared Error)
# - MAPE (Mean Absolute Percentage Error)
# - R² (Coefficient of Determination)
# - RMSLE (Root Mean Squared Log Error)
# - Theil-U (Theil Inequality Coefficient)

METRICS_CONFIG = {
    'confidence_level': 0.99,      # 99% confidence intervals
    'show_all_metrics': True,      # Display all metrics or just key ones
    'save_to_db': True             # Save metrics to database
}

# ============ DATABASE CONFIGURATION ============
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'casDB'
}

# ============ PROGRAM NAMES MAPPING ============
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