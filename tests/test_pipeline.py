"""
Tests for Credit Risk Prediction API.
Run with: python -m pytest tests/
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import pytest
import json

# We test the predictor logic directly, not via HTTP
from utils.preprocessor import prepare_training_data, save_artifacts, load_artifacts, encode_and_scale
from models.train import train
import pandas as pd

DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/german_credit.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "../models")

SAMPLE_APPLICANT = {
    "checking_account": "0_to_200",
    "duration_months": 24,
    "credit_history": "existing_paid",
    "purpose": "car",
    "credit_amount": 5000,
    "savings_account": "100_to_500",
    "employment_since": "1_to_4yr",
    "installment_rate": 3,
    "personal_status": "male_single",
    "other_debtors": "none",
    "residence_since": 2,
    "property": "real_estate",
    "age_years": 30,
    "other_installments": "none",
    "housing": "own",
    "existing_credits": 1,
    "job": "skilled",
    "num_dependents": 1,
    "telephone": "none",
    "foreign_worker": "yes",
}


class TestPreprocessor:
    def test_data_loads(self):
        df = pd.read_csv(DATA_PATH)
        assert len(df) > 0
        assert "default" in df.columns

    def test_prepare_training_data(self):
        X_train, X_test, y_train, y_test, encoders, scaler = prepare_training_data(DATA_PATH)
        assert X_train.shape[0] > 0
        assert X_test.shape[0] > 0
        assert len(encoders) > 0

    def test_encode_single_applicant(self):
        _, _, _, _, encoders, scaler = prepare_training_data(DATA_PATH)
        df = pd.DataFrame([SAMPLE_APPLICANT])
        df_enc, _, _ = encode_and_scale(df, encoders=encoders, scaler=scaler, fit=False)
        assert df_enc.shape == (1, 20)


class TestModel:
    def test_training_runs(self):
        model, roc = train("random_forest")
        assert model is not None
        assert roc > 0.5, f"ROC-AUC too low: {roc}"

    def test_model_saved(self):
        model_path = os.path.join(MODEL_DIR, "random_forest.pkl")
        assert os.path.exists(model_path), "Model file not found after training"

    def test_artifacts_saved(self):
        assert os.path.exists(os.path.join(MODEL_DIR, "encoders.pkl"))
        assert os.path.exists(os.path.join(MODEL_DIR, "scaler.pkl"))


class TestPrediction:
    def test_single_prediction_shape(self):
        import joblib
        from utils.preprocessor import load_artifacts, encode_and_scale
        model = joblib.load(os.path.join(MODEL_DIR, "random_forest.pkl"))
        encoders, scaler = load_artifacts(MODEL_DIR)

        df = pd.DataFrame([SAMPLE_APPLICANT])
        df_enc, _, _ = encode_and_scale(df, encoders=encoders, scaler=scaler, fit=False)
        
        TRAIN_COL_ORDER = [
            'checking_account', 'duration_months', 'credit_history', 'purpose',
            'credit_amount', 'savings_account', 'employment_since', 'installment_rate',
            'personal_status', 'other_debtors', 'residence_since', 'property',
            'age_years', 'other_installments', 'housing', 'existing_credits',
            'job', 'num_dependents', 'telephone', 'foreign_worker'
        ]
        features = df_enc[TRAIN_COL_ORDER]
        prob = model.predict_proba(features)
        assert prob.shape == (1, 2)
        assert abs(prob[0].sum() - 1.0) < 1e-6

    def test_prediction_output_range(self):
        import joblib
        from utils.preprocessor import load_artifacts, encode_and_scale
        model = joblib.load(os.path.join(MODEL_DIR, "random_forest.pkl"))
        encoders, scaler = load_artifacts(MODEL_DIR)

        df = pd.DataFrame([SAMPLE_APPLICANT])
        df_enc, _, _ = encode_and_scale(df, encoders=encoders, scaler=scaler, fit=False)
        
        TRAIN_COL_ORDER = [
            'checking_account', 'duration_months', 'credit_history', 'purpose',
            'credit_amount', 'savings_account', 'employment_since', 'installment_rate',
            'personal_status', 'other_debtors', 'residence_since', 'property',
            'age_years', 'other_installments', 'housing', 'existing_credits',
            'job', 'num_dependents', 'telephone', 'foreign_worker'
        ]
        features = df_enc[TRAIN_COL_ORDER]
        prob_good = model.predict_proba(features)[0][1]
        assert 0.0 <= prob_good <= 1.0
