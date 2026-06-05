"""Chargement LightGBM, inférence spaCy + explications SHAP."""

import sys
from pathlib import Path

import joblib
import numpy as np

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from data.market_parser import market_data_bonus, market_data_factor
from ml.features import FEATURE_COLUMNS, build_feature_frame
from ml.shap_explainer import explain_prediction
from nlp.text_analyzer import spacy_insights

MODEL_PATH = ROOT / "models" / "success_model.joblib"

_pipeline = None


def is_model_loaded() -> bool:
    return _pipeline is not None


def _load_model():
    global _pipeline
    if _pipeline is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Modèle introuvable : {MODEL_PATH}. Exécutez training/train.py."
            )
        _pipeline = joblib.load(MODEL_PATH)
    return _pipeline


def _confidence(score: int, feats: dict) -> str:
    quality = int(feats.get("business_term_score", 0))
    desc_len = int(feats.get("desc_len", 0))
    if desc_len >= 100 and quality >= 4:
        return "high"
    if desc_len >= 50 and quality >= 2:
        return "medium"
    return "low"


def _merge_factors(shap_factors: list[dict], country: str, sector: str, description: str) -> list[dict]:
    factors: list[dict] = list(shap_factors)

    market = market_data_factor(country, sector)
    if market and not any(f.get("label", "").startswith("Donnée marché") for f in factors):
        factors.insert(0, market)

    for insight in spacy_insights(description):
        if len(factors) >= 6:
            break
        if not any(f.get("label") == insight for f in factors):
            factors.append({"label": insight, "impact": "+3", "source": "spacy"})

    return factors[:6]


def predict_success(
    country: str, sector: str, audience: str, description: str
) -> dict:
    pipeline = _load_model()
    X = build_feature_frame(country, sector, audience, description)
    feats = X.iloc[0].to_dict()

    raw = float(pipeline.predict(X[FEATURE_COLUMNS])[0])
    raw += market_data_bonus(country, sector)
    score = int(np.clip(round(raw), 0, 100))

    try:
        shap_factors = explain_prediction(pipeline, X[FEATURE_COLUMNS], top_k=4)
    except Exception:
        shap_factors = []

    return {
        "successScore": score,
        "confidence": _confidence(score, feats),
        "factors": _merge_factors(shap_factors, country, sector, description),
        "source": "ml-lightgbm-shap",
    }
