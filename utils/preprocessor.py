"""
Preprocessing pipeline for German Credit Risk dataset.
Handles encoding, scaling, and SMOTE for class imbalance.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE
import joblib
import os

CATEGORICAL_COLS = [
    'checking_account', 'credit_history', 'purpose', 'savings_account',
    'employment_since', 'personal_status', 'other_debtors', 'property',
    'other_installments', 'housing', 'job', 'telephone', 'foreign_worker'
]

NUMERICAL_COLS = [
    'duration_months', 'credit_amount', 'installment_rate',
    'residence_since', 'age_years', 'existing_credits', 'num_dependents'
]

TARGET_COL = 'default'


def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    print(f"[Preprocessor] Loaded {len(df)} rows, {df.shape[1]} columns")
    return df


def encode_and_scale(df: pd.DataFrame, encoders: dict = None, scaler=None, fit: bool = True):
    """
    Encodes categoricals and scales numericals.
    If fit=True, fits new encoders/scaler and returns them.
    If fit=False, uses provided encoders/scaler (for inference).
    """
    df = df.copy()

    if fit:
        encoders = {}
        for col in CATEGORICAL_COLS:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            encoders[col] = le

        scaler = StandardScaler()
        df[NUMERICAL_COLS] = scaler.fit_transform(df[NUMERICAL_COLS])
    else:
        for col in CATEGORICAL_COLS:
            le = encoders[col]
            # Handle unseen labels gracefully
            df[col] = df[col].astype(str).apply(
                lambda x: x if x in le.classes_ else le.classes_[0]
            )
            df[col] = le.transform(df[col])
        df[NUMERICAL_COLS] = scaler.transform(df[NUMERICAL_COLS])

    return df, encoders, scaler


def prepare_training_data(csv_path: str, test_size: float = 0.2, use_smote: bool = True):
    df = load_data(csv_path)

    df_encoded, encoders, scaler = encode_and_scale(df, fit=True)

    X = df_encoded.drop(columns=[TARGET_COL])
    y = df_encoded[TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )

    if use_smote:
        sm = SMOTE(random_state=42)
        X_train, y_train = sm.fit_resample(X_train, y_train)
        print(f"[Preprocessor] After SMOTE — class distribution: {dict(pd.Series(y_train).value_counts())}")

    print(f"[Preprocessor] Train: {X_train.shape}, Test: {X_test.shape}")
    return X_train, X_test, y_train, y_test, encoders, scaler


def save_artifacts(encoders: dict, scaler, output_dir: str = "models"):
    os.makedirs(output_dir, exist_ok=True)
    joblib.dump(encoders, os.path.join(output_dir, "encoders.pkl"))
    joblib.dump(scaler, os.path.join(output_dir, "scaler.pkl"))
    print(f"[Preprocessor] Encoders and scaler saved to {output_dir}/")


def load_artifacts(model_dir: str = "models"):
    encoders = joblib.load(os.path.join(model_dir, "encoders.pkl"))
    scaler = joblib.load(os.path.join(model_dir, "scaler.pkl"))
    return encoders, scaler
