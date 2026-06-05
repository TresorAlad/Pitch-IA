"""Extraction de données marché UEMOA via Beautiful Soup."""

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from bs4 import BeautifulSoup

DATA_DIR = Path(__file__).resolve().parent
MARKET_HTML = DATA_DIR / "market_uemoa.html"


@dataclass
class MarketInsight:
    country: str
    sector: str
    trend: str
    insight: str
    bonus: int


@lru_cache(maxsize=1)
def _load_all_insights() -> list[MarketInsight]:
    if not MARKET_HTML.exists():
        return []

    soup = BeautifulSoup(MARKET_HTML.read_text(encoding="utf-8"), "html.parser")
    results: list[MarketInsight] = []

    for article in soup.select("article[data-country][data-sector]"):
        bonus_el = article.select_one(".bonus")
        trend_el = article.select_one(".trend")
        insight_el = article.select_one(".insight")

        try:
            bonus = int(bonus_el.get_text(strip=True)) if bonus_el else 0
        except ValueError:
            bonus = 0

        results.append(
            MarketInsight(
                country=article["data-country"],
                sector=article["data-sector"],
                trend=trend_el.get_text(strip=True) if trend_el else "",
                insight=insight_el.get_text(strip=True) if insight_el else "",
                bonus=bonus,
            )
        )

    return results


def get_market_insight(country: str, sector: str) -> MarketInsight | None:
    """Retourne l'insight marché pour un couple pays/secteur (priorité match exact)."""
    insights = _load_all_insights()
    country = country or "uemoa"
    sector = sector or "Autre"

    for item in insights:
        if item.country == country and item.sector == sector:
            return item

    for item in insights:
        if item.country == "uemoa" and item.sector == sector:
            return item

    return None


def market_data_bonus(country: str, sector: str) -> int:
    insight = get_market_insight(country, sector)
    return insight.bonus if insight else 0


def market_data_factor(country: str, sector: str) -> dict | None:
    """Facteur explicatif basé sur les données HTML parsées."""
    insight = get_market_insight(country, sector)
    if not insight or insight.bonus <= 0:
        return None

    return {
        "label": f"Donnée marché : {insight.trend[:60]}",
        "impact": f"+{insight.bonus}",
        "source": "beautifulsoup",
    }
