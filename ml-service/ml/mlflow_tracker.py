"""Tracking MLflow pour les entraînements Pitch-IA."""

from __future__ import annotations

from pathlib import Path

import mlflow
import mlflow.sklearn
from sklearn.pipeline import Pipeline

ROOT = Path(__file__).resolve().parent.parent
MLFLOW_URI = ROOT / "mlruns"
EXPERIMENT_NAME = "pitch-ia-success-score"


def ensure_mlflow() -> None:
    """Vérifie que MLflow est installé."""
    try:
        import mlflow  # noqa: F401
    except ImportError as e:
        raise RuntimeError(
            "MLflow n'est pas installé. Utilisez Python 3.12 et exécutez :\n"
            "  cd ml-service && bash scripts/setup-venv.sh\n"
            "ou : pip install -r requirements-mlflow.txt"
        ) from e


def log_training_run(
    pipeline: Pipeline,
    r2: float,
    mae: float,
    samples: int,
    feature_columns: list[str],
    run_name: str = "lightgbm-spacy",
) -> str:
    ensure_mlflow()
    MLFLOW_URI.mkdir(parents=True, exist_ok=True)
    mlflow.set_tracking_uri(str(MLFLOW_URI))
    mlflow.set_experiment(EXPERIMENT_NAME)

    with mlflow.start_run(run_name=run_name) as run:
        mlflow.log_params({
            "model": "LightGBM",
            "n_estimators": 200,
            "max_depth": 5,
            "learning_rate": 0.06,
            "nlp": "spacy-fr_core_news_sm",
            "explainer": "shap",
            "samples": samples,
            "features": ",".join(feature_columns),
        })
        mlflow.log_metrics({"r2_test": r2, "mae_test": mae})
        mlflow.sklearn.log_model(pipeline, artifact_path="model")
        return run.info.run_id
