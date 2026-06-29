"""
Train a Random Forest classifier for credit risk prediction.
Evaluates with classification report, ROC-AUC, and confusion matrix.
Saves model + artifacts to models/.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    classification_report, roc_auc_score,
    confusion_matrix, ConfusionMatrixDisplay
)
import matplotlib.pyplot as plt

from utils.preprocessor import prepare_training_data, save_artifacts

DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/german_credit.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "../models")


def train(model_type: str = "random_forest"):
    print(f"\n{'='*50}")
    print(f"  Credit Risk Prediction — Training [{model_type}]")
    print(f"{'='*50}\n")

    X_train, X_test, y_train, y_test, encoders, scaler = prepare_training_data(DATA_PATH)

    if model_type == "random_forest":
        model = RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            min_samples_split=5,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        )
    elif model_type == "gradient_boosting":
        model = GradientBoostingClassifier(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=5,
            random_state=42
        )
    else:
        raise ValueError(f"Unknown model_type: {model_type}")

    print(f"[Trainer] Fitting {model_type}...")
    model.fit(X_train, y_train)

    # ── Evaluation ──
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    roc = roc_auc_score(y_test, y_prob)
    print(f"\n[Trainer] ROC-AUC: {roc:.4f}")
    print("\n[Trainer] Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Bad Credit", "Good Credit"]))

    # Confusion matrix plot
    cm = confusion_matrix(y_test, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["Bad Credit", "Good Credit"])
    fig, ax = plt.subplots(figsize=(6, 5))
    disp.plot(ax=ax, colorbar=False)
    ax.set_title(f"Confusion Matrix — {model_type}")
    os.makedirs(MODEL_DIR, exist_ok=True)
    fig.savefig(os.path.join(MODEL_DIR, "confusion_matrix.png"), dpi=150, bbox_inches='tight')
    plt.close()
    print(f"[Trainer] Confusion matrix saved.")

    # Feature importance
    feature_names = X_train.columns.tolist()
    importances = model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    print("\n[Trainer] Top 10 Feature Importances:")
    for i in sorted_idx[:10]:
        print(f"  {feature_names[i]:<30} {importances[i]:.4f}")

    # ── Save ──
    model_path = os.path.join(MODEL_DIR, f"{model_type}.pkl")
    joblib.dump(model, model_path)
    print(f"\n[Trainer] Model saved → {model_path}")

    save_artifacts(encoders, scaler, MODEL_DIR)

    print("\n[Trainer] Training complete!\n")
    return model, roc


if __name__ == "__main__":
    model_type = sys.argv[1] if len(sys.argv) > 1 else "random_forest"
    train(model_type)
