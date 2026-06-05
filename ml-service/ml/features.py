"""Features partagées entre entraînement et inférence."""

from __future__ import annotations

import pandas as pd

from nlp.text_analyzer import extract_text_features

CATEGORICAL = ["country", "sector", "audience"]
NUMERIC = [
    "desc_len",
    "word_count",
    "sentence_count",
    "entity_count",
    "money_entity_count",
    "org_entity_count",
    "business_term_score",
    "quality_score",
]
FEATURE_COLUMNS = CATEGORICAL + NUMERIC


def build_feature_row(
    country: str,
    sector: str,
    audience: str,
    description: str,
) -> dict:
    text_feats = extract_text_features(description)
    return {
        "country": country or "uemoa",
        "sector": sector or "Autre",
        "audience": audience or "investisseur",
        **text_feats,
    }


def build_feature_frame(
    country: str,
    sector: str,
    audience: str,
    description: str,
) -> pd.DataFrame:
    return pd.DataFrame([build_feature_row(country, sector, audience, description)])


def enrich_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Ajoute les features spaCy à un DataFrame contenant une colonne description."""
    rows = []
    for _, row in df.iterrows():
        feats = extract_text_features(str(row.get("description", "")))
        enriched = {col: row[col] for col in CATEGORICAL if col in row}
        enriched.update(feats)
        rows.append(enriched)
    return pd.DataFrame(rows)
