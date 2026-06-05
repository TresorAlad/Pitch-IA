"""Dataset synthétique UEMOA pour entraîner le modèle de score de réussite."""

import random

import numpy as np
import pandas as pd

COUNTRIES = ["ci", "sn", "ml", "bf", "ne", "tg", "bj", "gw", "uemoa"]
SECTORS = [
    "FinTech", "AgriTech", "EdTech", "HealthTech", "FoodTech",
    "LogisTech", "E-commerce", "SaaS B2B", "CleanTech", "Mobility", "Autre",
]
AUDIENCES = ["investisseur", "client", "partenaire", "incubateur"]

SECTOR_COUNTRY_BONUS = {
    ("FinTech", "ci"): 12, ("FinTech", "sn"): 12, ("FinTech", "uemoa"): 8,
    ("AgriTech", "bf"): 10, ("AgriTech", "ml"): 10, ("AgriTech", "ne"): 8,
    ("EdTech", "ci"): 8, ("EdTech", "sn"): 8,
    ("HealthTech", "ci"): 7, ("HealthTech", "sn"): 7,
    ("LogisTech", "ci"): 9, ("E-commerce", "ci"): 8, ("E-commerce", "sn"): 8,
    ("SaaS B2B", "sn"): 7, ("Mobility", "ci"): 6,
}

QUALITY_KEYWORDS = [
    "problème", "probleme", "solution", "marché", "marche", "client",
    "revenus", "mobile money", "fcfa", "abonnement", "commission",
    "partenaire", "scalable", "impact", "cible",
]

DESCRIPTION_TEMPLATES = {
    "good": [
        "Plateforme {sector} pour {target} en {country_label}. Problème : {problem}. "
        "Solution : {solution}. Marché cible estimé à {market} FCFA. Revenus via abonnement "
        "et commission Mobile Money. Partenaires opérateurs télécom.",
        "Startup {sector} adressant {problem} pour les PME de {country_label}. "
        "Notre solution digitale mobile-first permet {solution}. Modèle freemium + "
        "commission sur transactions FCFA. Impact social et scalabilité régionale.",
    ],
    "medium": [
        "Projet {sector} en {country_label} pour aider les entrepreneurs. "
        "Application mobile simple avec paiement local.",
        "Idée {sector} : plateforme en ligne pour connecter vendeurs et acheteurs "
        "dans la zone UEMOA.",
    ],
    "weak": [
        "Une app {sector}.",
        "Projet intéressant en {country_label}.",
        "Startup innovante sans détails.",
    ],
}

PROBLEMS = [
    "accès limité au crédit", "logistique coûteuse", "faible digitalisation des PME",
    "pertes post-récolte", "accès aux soins en zone rurale",
]
SOLUTIONS = [
    "micro-crédit via Mobile Money", "marketplace B2B", "formation en ligne",
    "suivi agricole par SMS", "télémédecine low-cost",
]
TARGETS = ["commerçants", "agriculteurs", "étudiants", "PME urbaines", "livreurs"]
COUNTRY_LABELS = {
    "ci": "Côte d'Ivoire", "sn": "Sénégal", "ml": "Mali", "bf": "Burkina Faso",
    "ne": "Niger", "tg": "Togo", "bj": "Bénin", "gw": "Guinée-Bissau",
    "uemoa": "zone UEMOA",
}


def _quality_score(text: str) -> int:
    lower = text.lower()
    return sum(1 for kw in QUALITY_KEYWORDS if kw in lower)


def _generate_description(quality: str, sector: str, country: str) -> str:
    templates = DESCRIPTION_TEMPLATES[quality]
    template = random.choice(templates)
    return template.format(
        sector=sector,
        country_label=COUNTRY_LABELS.get(country, country),
        target=random.choice(TARGETS),
        problem=random.choice(PROBLEMS),
        solution=random.choice(SOLUTIONS),
        market=random.randint(500, 50000) * 1000,
    )


def _compute_target_score(
    country: str, sector: str, audience: str, desc_len: int, quality: int
) -> float:
    base = 35.0
    base += SECTOR_COUNTRY_BONUS.get((sector, country), 0)
    base += SECTOR_COUNTRY_BONUS.get((sector, "uemoa"), 0) * 0.3

    audience_bonus = {"investisseur": 5, "incubateur": 4, "partenaire": 3, "client": 2}
    base += audience_bonus.get(audience, 0)

    if desc_len >= 200:
        base += 15
    elif desc_len >= 100:
        base += 10
    elif desc_len >= 50:
        base += 5
    elif desc_len < 30:
        base -= 10

    base += quality * 4

    if sector == "Autre":
        base -= 5

    noise = random.gauss(0, 6)
    return float(np.clip(base + noise, 5, 95))


def generate_dataset(n_samples: int = 800, seed: int = 42) -> pd.DataFrame:
    random.seed(seed)
    np.random.seed(seed)

    rows = []
    quality_levels = ["good", "medium", "weak"]
    weights = [0.4, 0.4, 0.2]

    for _ in range(n_samples):
        country = random.choice(COUNTRIES)
        sector = random.choice(SECTORS)
        audience = random.choice(AUDIENCES)
        quality_level = random.choices(quality_levels, weights=weights)[0]
        description = _generate_description(quality_level, sector, country)

        # Features spaCy calculées au moment de l'entraînement via enrich_dataframe
        score = _compute_target_score(
            country, sector, audience, len(description), _quality_score(description)
        )

        rows.append({
            "country": country,
            "sector": sector,
            "audience": audience,
            "description": description,
            "success_score": round(score),
        })

    return pd.DataFrame(rows)
