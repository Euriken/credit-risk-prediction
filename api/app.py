"""
Flask REST API for Credit Risk Prediction.

Endpoints:
  POST /predict       — Single applicant prediction (includes SHAP explanations)
  POST /predict/batch — Batch prediction (list of applicants)
  GET  /health        — Health check
  GET  /model/info    — Model metadata
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import joblib
import numpy as np
import pandas as pd
import shap
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

from utils.preprocessor import (
    encode_and_scale, load_artifacts,
    CATEGORICAL_COLS, NUMERICAL_COLS
)

app = Flask(__name__)
CORS(app)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "../models")
MODEL_PATH = os.path.join(MODEL_DIR, "random_forest.pkl")

# ── Load model and artifacts at startup ──
try:
    model = joblib.load(MODEL_PATH)
    encoders, scaler = load_artifacts(MODEL_DIR)
    MODEL_LOADED = True
    print(f"[API] Model loaded from {MODEL_PATH}")
    # Build SHAP explainer once (expensive, reused per request)
    shap_explainer = shap.TreeExplainer(model)
    SHAP_LOADED = True
    print("[API] SHAP explainer initialised")
except Exception as e:
    MODEL_LOADED = False
    SHAP_LOADED = False
    print(f"[API] WARNING: Could not load model — {e}")
    print("[API] Run `python models/train.py` first.")


REQUIRED_FIELDS = CATEGORICAL_COLS + NUMERICAL_COLS

RISK_THRESHOLDS = {
    "low":    (0.70, 1.00),
    "medium": (0.40, 0.70),
    "high":   (0.00, 0.40),
}


def probability_to_risk_label(prob_good: float) -> str:
    for label, (lo, hi) in RISK_THRESHOLDS.items():
        if lo <= prob_good < hi:
            return label
    return "high"


# Human-readable labels for SHAP feature names
FEATURE_LABELS = {
    'checking_account':    'Checking Account',
    'duration_months':     'Loan Duration',
    'credit_history':      'Credit History',
    'purpose':             'Loan Purpose',
    'credit_amount':       'Credit Amount',
    'savings_account':     'Savings Account',
    'employment_since':    'Employment Duration',
    'installment_rate':    'Installment Rate',
    'personal_status':     'Personal Status',
    'other_debtors':       'Other Debtors',
    'residence_since':     'Residence Duration',
    'property':            'Property Type',
    'age_years':           'Age',
    'other_installments':  'Other Installments',
    'housing':             'Housing Type',
    'existing_credits':    'Existing Credits',
    'job':                 'Job Category',
    'num_dependents':      'Dependents',
    'telephone':           'Telephone',
    'foreign_worker':      'Foreign Worker',
}


def predict_single(applicant: dict):
    df = pd.DataFrame([applicant])

    # Validate fields
    missing = [f for f in REQUIRED_FIELDS if f not in df.columns]
    if missing:
        raise ValueError(f"Missing fields: {missing}")

    df_enc, _, _ = encode_and_scale(df, encoders=encoders, scaler=scaler, fit=False)
    TRAIN_COL_ORDER = [
        'checking_account', 'duration_months', 'credit_history', 'purpose',
        'credit_amount', 'savings_account', 'employment_since', 'installment_rate',
        'personal_status', 'other_debtors', 'residence_since', 'property',
        'age_years', 'other_installments', 'housing', 'existing_credits',
        'job', 'num_dependents', 'telephone', 'foreign_worker'
    ]
    features = df_enc[TRAIN_COL_ORDER]

    prob = model.predict_proba(features)[0]
    prob_bad, prob_good = float(prob[0]), float(prob[1])
    prediction = int(model.predict(features)[0])  # 1=good, 0=bad

    # ── SHAP explanations ──
    shap_contributions = []
    if SHAP_LOADED:
        try:
            sv = shap_explainer.shap_values(features)
            
            # Robust parser for SHAP output structure
            if isinstance(sv, list):
                # Older SHAP versions return a list of ndarrays for classification
                vals = sv[1][0] if len(sv) > 1 else sv[0][0]
            elif isinstance(sv, np.ndarray):
                if sv.ndim == 3:
                    # Shape: (n_samples, n_features, n_classes)
                    # Class 1 (good credit) is at index 1
                    vals = sv[0, :, 1] if sv.shape[2] > 1 else sv[0, :, 0]
                elif sv.ndim == 2:
                    # Shape: (n_samples, n_features)
                    vals = sv[0]
                else:
                    vals = sv.ravel()
            else:
                vals = np.array(sv).ravel()
                
            feature_names = TRAIN_COL_ORDER
            # Sort by absolute impact, take top 8
            ranked = sorted(
                zip(feature_names, vals.tolist()),
                key=lambda x: abs(x[1]),
                reverse=True
            )[:8]
            shap_contributions = [
                {
                    "feature": feat,
                    "label":   FEATURE_LABELS.get(feat, feat),
                    "value":   round(val, 4),
                    "direction": "positive" if val >= 0 else "negative",
                }
                for feat, val in ranked
            ]
        except Exception as shap_err:
            print(f"[API] SHAP computation warning: {shap_err}")

    return {
        "prediction": "good_credit" if prediction == 1 else "bad_credit",
        "probability_good_credit": round(prob_good, 4),
        "probability_bad_credit": round(prob_bad, 4),
        "risk_level": probability_to_risk_label(prob_good),
        "approved": prediction == 1,
        "shap_contributions": shap_contributions,
    }


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok" if MODEL_LOADED else "model_not_loaded",
        "timestamp": datetime.utcnow().isoformat(),
        "model_loaded": MODEL_LOADED,
    })


@app.route("/model/info", methods=["GET"])
def model_info():
    if not MODEL_LOADED:
        return jsonify({"error": "Model not loaded"}), 503
    return jsonify({
        "model_type": type(model).__name__,
        "n_estimators": getattr(model, "n_estimators", "N/A"),
        "features": REQUIRED_FIELDS,
        "target": "default (0=bad, 1=good)",
        "risk_thresholds": RISK_THRESHOLDS,
    })


@app.route("/predict", methods=["POST"])
def predict():
    if not MODEL_LOADED:
        return jsonify({"error": "Model not loaded. Run training first."}), 503

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON body provided"}), 400

    try:
        result = predict_single(data)
        return jsonify({"success": True, "result": result})
    except ValueError as e:
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


@app.route("/predict/batch", methods=["POST"])
def predict_batch():
    if not MODEL_LOADED:
        return jsonify({"error": "Model not loaded. Run training first."}), 503

    data = request.get_json()
    if not isinstance(data, list):
        return jsonify({"error": "Expected a JSON array of applicants"}), 400

    results = []
    for i, applicant in enumerate(data):
        try:
            result = predict_single(applicant)
            results.append({"index": i, "success": True, "result": result})
        except Exception as e:
            results.append({"index": i, "success": False, "error": str(e)})

    return jsonify({"total": len(data), "results": results})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    print(f"[API] Starting on port {port} | debug={debug}")
    app.run(host="0.0.0.0", port=port, debug=debug)
