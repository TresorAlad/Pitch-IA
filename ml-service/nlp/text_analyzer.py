"""Analyse NLP française des descriptions de pitch (spaCy)."""

from __future__ import annotations

from functools import lru_cache

import spacy
from spacy.language import Language
from spacy.matcher import PhraseMatcher

ROOT_TERMS = {
    "problème": "Problème identifié (NLP)",
    "probleme": "Problème identifié (NLP)",
    "solution": "Solution décrite (NLP)",
    "marché": "Marché mentionné (NLP)",
    "marche": "Marché mentionné (NLP)",
    "client": "Clients cibles (NLP)",
    "revenus": "Modèle de revenus (NLP)",
    "mobile money": "Mobile Money (NLP)",
    "fcfa": "Monétisation FCFA (NLP)",
    "abonnement": "Modèle abonnement (NLP)",
    "commission": "Modèle commission (NLP)",
    "partenaire": "Partenariats (NLP)",
    "impact": "Impact social (NLP)",
    "startup": "Vocabulaire entrepreneurial (NLP)",
    "marché cible": "Marché cible (NLP)",
}


@lru_cache(maxsize=1)
def get_nlp() -> Language:
    try:
        return spacy.load("fr_core_news_sm")
    except OSError:
        from spacy.cli import download
        download("fr_core_news_sm")
        return spacy.load("fr_core_news_sm")


@lru_cache(maxsize=1)
def _business_matcher() -> tuple[Language, PhraseMatcher]:
    nlp = get_nlp()
    matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
    patterns = [nlp.make_doc(term) for term in ROOT_TERMS]
    matcher.add("BUSINESS_TERMS", patterns)
    return nlp, matcher


def extract_text_features(description: str) -> dict[str, int | float]:
    text = (description or "").strip()
    if not text:
        return {
            "desc_len": 0,
            "word_count": 0,
            "sentence_count": 0,
            "entity_count": 0,
            "money_entity_count": 0,
            "org_entity_count": 0,
            "business_term_score": 0,
            "quality_score": 0,
        }

    nlp, matcher = _business_matcher()
    doc = nlp(text[:2000])
    words = [t for t in doc if not t.is_space and not t.is_punct and not t.is_stop]

    business_hits = len(matcher(doc))
    entities = list(doc.ents)

    return {
        "desc_len": len(text),
        "word_count": len(words),
        "sentence_count": max(1, len(list(doc.sents))),
        "entity_count": len(entities),
        "money_entity_count": sum(1 for e in entities if e.label_ in ("MONEY", "QUANTITY")),
        "org_entity_count": sum(1 for e in entities if e.label_ == "ORG"),
        "business_term_score": business_hits,
        "quality_score": business_hits,
    }


def spacy_insights(description: str) -> list[str]:
    """Labels lisibles dérivés de l'analyse spaCy."""
    text = (description or "").strip().lower()
    if not text:
        return []

    nlp, matcher = _business_matcher()
    doc = nlp(text[:2000])
    insights: list[str] = []
    matched = set()

    for _, start, end in matcher(doc):
        span = doc[start:end].text.lower()
        label = ROOT_TERMS.get(span)
        if label and label not in matched:
            matched.add(label)
            insights.append(label)

    if doc.ents:
        insights.append(f"{len(doc.ents)} entité(s) détectée(s) (spaCy)")

    return insights[:4]
