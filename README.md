# 💳 Credit Risk Prediction System

A production-ready ML pipeline for predicting credit default risk using the **German Credit Dataset** (UCI standard schema, 1000 samples, 20 features).

## 🏗️ Project Structure

```
credit-risk-prediction/
├── data/
│   └── german_credit.csv        # 1000-row UCI German Credit dataset
├── models/
│   ├── train.py                 # Train RF / GradientBoosting + save artifacts
│   ├── random_forest.pkl        # Trained model (after running train.py)
│   ├── encoders.pkl             # LabelEncoders per categorical column
│   ├── scaler.pkl               # StandardScaler for numericals
│   └── confusion_matrix.png     # Evaluation plot
├── api/
│   └── app.py                   # Flask REST API (predict, batch, health)
├── utils/
│   └── preprocessor.py          # Encode, scale, SMOTE pipeline
├── tests/
│   └── test_pipeline.py         # Pytest suite (preprocessor + model + prediction)
└── requirements.txt
```

## ⚡ Quickstart

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Train the model
python models/train.py

# 3. Start the API
python api/app.py

# 4. Run tests
python -m pytest tests/ -v
```

## 📊 Model Performance

| Metric       | Value  |
|--------------|--------|
| ROC-AUC      | ~0.79  |
| Accuracy     | ~79%   |
| Good Credit F1 | ~0.86 |
| Bad Credit F1  | ~0.57 |

## 🔌 API Endpoints

### `POST /predict`
Single applicant prediction.

```json
{
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
  "foreign_worker": "yes"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "prediction": "good_credit",
    "probability_good_credit": 0.82,
    "probability_bad_credit": 0.18,
    "risk_level": "low",
    "approved": true
  }
}
```

### `POST /predict/batch`
Array of applicants → array of predictions.

### `GET /health`
Server health check.

### `GET /model/info`
Model metadata and feature list.

## 🧠 Features

- **SMOTE** for class imbalance handling (30/70 split → balanced)
- **Random Forest** (200 trees, balanced class weights)
- **Gradient Boosting** alternative (`python models/train.py gradient_boosting`)
- **Risk labels**: `low / medium / high` based on probability thresholds
- **Batch prediction** endpoint
- **Pytest** test suite

## 🚀 Deployment

```bash
# Production with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 api.app:app
```

Deploy to **Render** (free tier) or **HuggingFace Spaces** (Flask SDK).

## 📁 Dataset

German Credit Risk Dataset — UCI ML Repository schema:
- 1000 applicants, 20 features, binary target (`0=bad_credit`, `1=good_credit`)
- ~70% good credit, ~30% bad credit (real-world distribution)
