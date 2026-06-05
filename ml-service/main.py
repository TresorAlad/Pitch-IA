import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from pitch_generator import generate_consultant_insights, generate_pitch
from predictor import is_model_loaded, predict_success
from schemas import (
    ConsultantInsights,
    PitchRequest,
    PitchResponse,
    SuccessPredictionResponse,
)
from data.market_parser import get_market_insight, _load_all_insights


def _mlflow_status() -> dict:
    try:
        from ml.mlflow_tracker import MLFLOW_URI, EXPERIMENT_NAME, ensure_mlflow
        import mlflow
        ensure_mlflow()
        mlflow.set_tracking_uri(str(MLFLOW_URI))
        exp = mlflow.get_experiment_by_name(EXPERIMENT_NAME)
        runs = mlflow.search_runs(experiment_ids=[exp.experiment_id], max_results=1) if exp else []
        return {
            "installed": True,
            "tracking_uri": str(MLFLOW_URI),
            "experiment": EXPERIMENT_NAME,
            "last_run_id": runs[0].info.run_id if len(runs) else None,
        }
    except Exception as e:
        return {"installed": False, "error": str(e)}


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from predictor import _load_model
        _load_model()
        from nlp.text_analyzer import get_nlp
        get_nlp()
    except FileNotFoundError:
        pass
    yield


app = FastAPI(
    title="Pitch-IA ML Service",
    description="Score LightGBM + synthèse pitch/insights (spaCy, SHAP, marché UEMOA) — secours si Groq indisponible",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
def health():
    loaded = is_model_loaded()
    return {
        "status": "ok" if loaded else "degraded",
        "service": "pitch-ia-ml",
        "model_loaded": loaded,
        "mlflow": _mlflow_status(),
    }


@app.get("/market-data")
def market_data(country: str = "", sector: str = ""):
    """Données marché extraites du HTML UEMOA via Beautiful Soup."""
    if country and sector:
        insight = get_market_insight(country, sector)
        if not insight:
            return {"found": False}
        return {
            "found": True,
            "country": insight.country,
            "sector": insight.sector,
            "trend": insight.trend,
            "insight": insight.insight,
            "bonus": insight.bonus,
            "source": "beautifulsoup",
        }
    insights = _load_all_insights()
    return {
        "count": len(insights),
        "items": [
            {
                "country": i.country,
                "sector": i.sector,
                "trend": i.trend,
                "bonus": i.bonus,
            }
            for i in insights
        ],
        "source": "beautifulsoup",
    }


@app.post("/predict-success", response_model=SuccessPredictionResponse)
def predict_success_endpoint(req: PitchRequest):
    try:
        result = predict_success(req.country, req.sector, req.audience, req.description)
        return SuccessPredictionResponse(**result)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur prédiction : {e}")


@app.post("/synthesize-pitch", response_model=PitchResponse)
def synthesize_pitch_endpoint(req: PitchRequest):
    """Pitch + insights dérivés du pipeline ML (LightGBM, SHAP, spaCy, données marché)."""
    try:
        result = generate_pitch(req.country, req.sector, req.audience, req.description)
        return PitchResponse(**result)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur synthèse ML : {e}")


@app.post("/synthesize-insights", response_model=ConsultantInsights)
def synthesize_insights_endpoint(req: PitchRequest):
    """Insights consultant uniquement (même pipeline que synthesize-pitch)."""
    try:
        pred = predict_success(req.country, req.sector, req.audience, req.description)
        return ConsultantInsights(
            **generate_consultant_insights(
                req.country, req.sector, req.audience, req.description, pred
            )
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur insights ML : {e}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8090"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
