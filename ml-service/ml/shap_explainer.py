"""Explications SHAP pour le score de viabilité."""

from __future__ import annotations

import re

import numpy as np
import pandas as pd
import shap
from sklearn.compose import ColumnTransformer

COUNTRY_LABELS = {
    "ci": "Côte d'Ivoire",
    "sn": "Sénégal",
    "ml": "Mali",
    "bf": "Burkina Faso",
    "ne": "Niger",
    "tg": "Togo",
    "bj": "Bénin",
    "gw": "Guinée-Bissau",
    "uemoa": "zone UEMOA",
}

NUMERIC_LABELS = {
    "desc_len": "Longueur de la description",
    "word_count": "Richesse du vocabulaire",
    "sentence_count": "Structure en phrases",
    "entity_count": "Entités nommées détectées",
    "money_entity_count": "Montants / quantités détectés",
    "org_entity_count": "Organisations mentionnées",
    "business_term_score": "Termes business (spaCy)",
    "quality_score": "Score qualité texte (spaCy)",
}

AUDIENCE_LABELS = {
    "investisseur": "Public investisseur",
    "client": "Public client",
    "partenaire": "Public partenaire",
    "incubateur": "Public incubateur",
}


def _feature_names(preprocessor: ColumnTransformer) -> list[str]:
    names: list[str] = []
    for name, transformer, cols in preprocessor.transformers_:
        if name == "cat" and hasattr(transformer, "get_feature_names_out"):
            names.extend(transformer.get_feature_names_out(cols).tolist())
        elif name == "num":
            names.extend(list(cols))
    return names


def _humanize_feature(name: str) -> str:
    if name in NUMERIC_LABELS:
        return NUMERIC_LABELS[name]

    if name.startswith("country_"):
        code = name.replace("country_", "")
        return f"Pays : {COUNTRY_LABELS.get(code, code)}"
    if name.startswith("sector_"):
        return f"Secteur {name.replace('sector_', '')}"
    if name.startswith("audience_"):
        code = name.replace("audience_", "")
        return AUDIENCE_LABELS.get(code, f"Public {code}")

    return re.sub(r"_+", " ", name).strip().capitalize()


def explain_prediction(pipeline, X: pd.DataFrame, top_k: int = 4) -> list[dict]:
    preprocessor: ColumnTransformer = pipeline.named_steps["preprocessor"]
    regressor = pipeline.named_steps["regressor"]

    X_processed = preprocessor.transform(X)
    if hasattr(X_processed, "toarray"):
        X_processed = X_processed.toarray()

    explainer = shap.TreeExplainer(regressor)
    shap_values = explainer.shap_values(X_processed)
    if isinstance(shap_values, list):
        shap_values = shap_values[0]

    values = np.array(shap_values[0])
    names = _feature_names(preprocessor)

    pairs = sorted(
        zip(names, values),
        key=lambda x: abs(x[1]),
        reverse=True,
    )

    factors: list[dict] = []
    for name, val in pairs:
        if abs(val) < 0.05:
            continue
        impact = f"{'+' if val >= 0 else ''}{val:.1f}"
        factors.append({
            "label": _humanize_feature(name),
            "impact": impact,
            "source": "shap",
        })
        if len(factors) >= top_k:
            break

    return factors
