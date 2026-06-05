"""
Synthèse pitch + insights à partir du pipeline ML réel :
LightGBM, SHAP, spaCy (fr), données marché Beautiful Soup.
Utilisé en secours lorsque l'API Groq est indisponible.
"""

from __future__ import annotations

import re

from data.market_parser import get_market_insight
from nlp.text_analyzer import extract_text_features, get_nlp, spacy_insights
from predictor import predict_success

COUNTRY_LABELS = {
    "ci": "Côte d'Ivoire",
    "sn": "Sénégal",
    "ml": "Mali",
    "bf": "Burkina Faso",
    "ne": "Niger",
    "tg": "Togo",
    "bj": "Bénin",
    "gw": "Guinée-Bissau",
    "uemoa": "la zone UEMOA",
}

AUDIENCE_KPI = {
    "investisseur": "Valider 10 entretiens terrain, 1 pilote ou LOI, documenter CAC pilote en FCFA",
    "client": "50 utilisateurs actifs semaine 4, NPS pilote, taux conversion essai → usage régulier",
    "partenaire": "2 LOI partenaires, intégration technique validée, premier flux revenus partagés FCFA",
    "incubateur": "MVP testé avec 20 utilisateurs, impact mesurable sur le problème, roadmap 90 j validée",
}


def _country_label(code: str) -> str:
    return COUNTRY_LABELS.get((code or "").lower(), code or "UEMOA")


def _first_sentence(text: str, max_len: int = 200) -> str:
    text = (text or "").strip()
    if not text:
        return ""
    parts = re.split(r"(?<=[.!?])\s+", text)
    first = parts[0] if parts else text
    return first[:max_len].rstrip(".")


def _entities_summary(description: str) -> str:
    nlp = get_nlp()
    doc = nlp((description or "")[:2000])
    labels = []
    for ent in doc.ents[:5]:
        labels.append(f"{ent.text} ({ent.label_})")
    return ", ".join(labels) if labels else ""


def _factors_by_source(factors: list[dict], source: str) -> list[dict]:
    return [f for f in factors if f.get("source") == source]


def _format_factor_line(f: dict) -> str:
    impact = f.get("impact", "")
    label = f.get("label", "")
    src = f.get("source", "ml")
    return f"{label} ({impact}, source {src})"


def generate_consultant_insights(
    country: str,
    sector: str,
    audience: str,
    description: str,
    prediction: dict,
) -> dict:
    score = int(prediction.get("successScore", 0))
    confidence = prediction.get("confidence", "medium")
    factors = prediction.get("factors") or []
    market = get_market_insight(country, sector)
    feats = extract_text_features(description)
    project = _first_sentence(description, 80) or "le projet"

    tendance_parts: list[str] = []
    if market and market.trend:
        tendance_parts.append(
            f"Marché {sector} · {_country_label(country)} : {market.trend} "
            f"(donnée UEMOA parsée, bonus modèle +{market.bonus})."
        )
    if market and market.insight:
        tendance_parts.append(market.insight)
    for f in _factors_by_source(factors, "shap")[:2]:
        tendance_parts.append(_format_factor_line(f))
    for ins in spacy_insights(description)[:2]:
        tendance_parts.append(f"Signal NLP : {ins}.")
    if not tendance_parts:
        tendance_parts.append(
            f"Pipeline ML actif (spaCy FR, score {score}/100) — enrichir la description "
            f"pour plus de signaux ({feats.get('word_count', 0)} mots analysés)."
        )

    kpis_base = AUDIENCE_KPI.get(audience, AUDIENCE_KPI["investisseur"])
    kpis = (
        f"Score LightGBM : {score}/100 (confiance {confidence}). "
        f"Objectifs 90 j ({audience}) : {kpis_base}."
    )

    risk_parts: list[str] = []
    for f in factors:
        impact = str(f.get("impact", ""))
        if impact.startswith("-"):
            risk_parts.append(_format_factor_line(f))
    if confidence == "low":
        risk_parts.append(
            f"Description courte ou peu de termes business détectés "
            f"({feats.get('business_term_score', 0)} termes, {feats.get('desc_len', 0)} car.)."
        )
    if not risk_parts:
        risk_parts.append(
            "Surveiller coût d'acquisition terrain et dépendance partenaires locaux "
            f"pour « {project} » en {_country_label(country)}."
        )

    etapes = (
        f"1) Interviews ciblées sur : {_first_sentence(description, 120)}. "
        f"2) MVP minimal (score actuel {score}/100). "
        f"3) Pilote 4 semaines avec KPI {audience} et réévaluation SHAP."
    )

    return {
        "tendancesIT": " ".join(tendance_parts[:3]),
        "kpis90j": kpis,
        "risques": " ".join(risk_parts[:3]),
        "prochainesEtapes": etapes,
    }


def generate_pitch(country: str, sector: str, audience: str, description: str) -> dict:
    """Pitch structuré dérivé des sorties ML/NLP/marché (pas de template secteur générique)."""
    prediction = predict_success(country, sector, audience, description)
    market = get_market_insight(country, sector)
    feats = extract_text_features(description)
    factors = prediction.get("factors") or []
    score = int(prediction.get("successScore", 0))
    confidence = prediction.get("confidence", "medium")
    zone = _country_label(country)
    desc = (description or "").strip()
    project = _first_sentence(desc, 100) or "Projet décrit"
    entities = _entities_summary(desc)
    nlp_signals = spacy_insights(desc)

    market_block = ""
    if market:
        market_block = (
            f" Donnée marché UEMOA : {market.trend}. {market.insight}"
            if market.insight
            else f" Tendance marché : {market.trend}."
        )

    shap_lines = [_format_factor_line(f) for f in _factors_by_source(factors, "shap")[:3]]
    shap_text = " Facteurs SHAP : " + " · ".join(shap_lines) + "." if shap_lines else ""

    probleme = (
        f"Besoin exprimé ({zone}, secteur {sector}) : {desc} "
        f"Analyse NLP : {feats.get('word_count', 0)} mots, "
        f"{feats.get('entity_count', 0)} entité(s) nommée(s)."
        f"{market_block}"
    )

    solution = (
        f"Réponse proposée — {project}. "
        f"Score de viabilité LightGBM : {score}/100 (confiance {confidence})."
    )
    if entities:
        solution += f" Entités détectées : {entities}."
    if nlp_signals:
        solution += f" Signaux texte : {', '.join(nlp_signals[:3])}."

    marche = (
        f"Cible {zone} · secteur {sector}. "
        f"Score modèle : {score}/100."
        f"{market_block or ' Pas de fiche marché UEMOA pour ce couple pays/secteur.'}"
        f"{shap_text}"
    )

    valeur_parts = []
    for f in factors[:4]:
        if not str(f.get("impact", "")).startswith("-"):
            valeur_parts.append(_format_factor_line(f))
    if nlp_signals:
        valeur_parts.append("Analyse spaCy : " + ", ".join(nlp_signals[:3]))
    valeur = (
        "Proposition de valeur (dérivée du pipeline ML) : "
        + (" · ".join(valeur_parts) if valeur_parts else f"Alignement sur « {project} » et contexte {zone}.")
        + f" Public : {audience}."
    )

    canaux = (
        f"Déploiement recommandé pour {zone} : canaux mobile-first (WhatsApp, USSD si besoin), "
        f"partenariats locaux secteur {sector}."
    )
    if feats.get("org_entity_count", 0) > 0:
        canaux += f" {feats['org_entity_count']} organisation(s) mentionnée(s) dans la description — cibles partenariat."

    modele = (
        f"Modèle économique à préciser selon signaux NLP "
        f"(termes business détectés : {feats.get('business_term_score', 0)}). "
        f"Score LightGBM {score}/100 — ajuster pricing FCFA après pilote."
        f"{shap_text}"
    )

    insights = generate_consultant_insights(country, sector, audience, description, prediction)

    return {
        "probleme": probleme.strip(),
        "solution": solution.strip(),
        "marche": marche.strip(),
        "valeur": valeur.strip(),
        "canaux": canaux.strip(),
        "modele": modele.strip(),
        "source": "ml-pipeline",
        "consultantInsights": insights,
    }
