"""Entraîne le modèle LightGBM avec spaCy, MLflow et export joblib."""

import json
import sys
from pathlib import Path

import joblib
import pandas as pd
from lightgbm import LGBMRegressor
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "training"))
sys.path.insert(0, str(ROOT))

from ml.features import CATEGORICAL, FEATURE_COLUMNS, NUMERIC, enrich_dataframe
from ml.mlflow_tracker import log_training_run
from synthetic_data import generate_dataset

MODELS_DIR = ROOT / "models"
MODELS_DIR.mkdir(exist_ok=True)


def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL),
            ("num", "passthrough", NUMERIC),
        ]
    )
    model = LGBMRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.06,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
        verbose=-1,
    )
    return Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", model),
    ])


def main() -> None:
    df = generate_dataset(n_samples=800)
    X = enrich_dataframe(df)
    y = df["success_score"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    pipeline = build_pipeline()
    pipeline.fit(X_train[FEATURE_COLUMNS], y_train)
    preds = pipeline.predict(X_test[FEATURE_COLUMNS])

    r2 = float(r2_score(y_test, preds))
    mae = float(mean_absolute_error(y_test, preds))

    print(f"R² sur test : {r2:.3f}")
    print(f"MAE sur test : {mae:.2f}")

    run_id = log_training_run(pipeline, r2, mae, len(df), FEATURE_COLUMNS)
    print(f"MLflow run ID : {run_id}")
    print(f"MLflow UI    : mlflow ui --backend-store-uri {ROOT / 'mlruns'} --port 5000")

    model_path = MODELS_DIR / "success_model.joblib"
    joblib.dump(pipeline, model_path)
    print(f"Modèle exporté : {model_path}")

    config = {
        "model": "LightGBM",
        "categorical": CATEGORICAL,
        "numeric": NUMERIC,
        "features": FEATURE_COLUMNS,
        "countries": sorted(df["country"].unique().tolist()),
        "sectors": sorted(df["sector"].unique().tolist()),
        "audiences": sorted(df["audience"].unique().tolist()),
        "nlp": "spacy-fr_core_news_sm",
        "explainer": "shap",
    }
    config_path = MODELS_DIR / "feature_config.json"
    config_path.write_text(json.dumps(config, indent=2, ensure_ascii=False))
    print(f"Config exportée : {config_path}")


if __name__ == "__main__":
    main()
