from pydantic import BaseModel, Field


class PitchRequest(BaseModel):
    country: str = Field(default="uemoa")
    sector: str = Field(default="Autre")
    audience: str = Field(default="investisseur")
    description: str = Field(min_length=10, max_length=2000)


class PredictionFactor(BaseModel):
    label: str
    impact: str
    source: str | None = None


class SuccessPredictionResponse(BaseModel):
    successScore: int = Field(ge=0, le=100)
    confidence: str
    factors: list[PredictionFactor]
    source: str = "ml-lightgbm-shap"


class ConsultantInsights(BaseModel):
    tendancesIT: str = ""
    kpis90j: str = ""
    risques: str = ""
    prochainesEtapes: str = ""


class PitchResponse(BaseModel):
    probleme: str
    solution: str
    marche: str
    valeur: str
    canaux: str
    modele: str
    source: str = "ml-pipeline"
    consultantInsights: ConsultantInsights | None = None
