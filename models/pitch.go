package models

// ConsultantInsights regroupe les recommandations consultant digital.
type ConsultantInsights struct {
	TendancesIT      string `json:"tendancesIT,omitempty"`
	Kpis90j          string `json:"kpis90j,omitempty"`
	Risques          string `json:"risques,omitempty"`
	ProchainesEtapes string `json:"prochainesEtapes,omitempty"`
}

// PitchResponse contient les 6 sections du pitch généré.
type PitchResponse struct {
	Probleme string
	Solution string
	Marche   string
	Valeur   string
	Canaux   string
	Modele   string
	Insights *ConsultantInsights
}

// PitchContext regroupe les entrées utilisateur pour la génération IA.
type PitchContext struct {
	Description string
	Country     string
	Sector      string
	Audience    string
}

// PredictionFactor décrit un facteur influençant le score de réussite.
type PredictionFactor struct {
	Label  string `json:"label"`
	Impact string `json:"impact"`
	Source string `json:"source,omitempty"`
}

// SuccessPrediction contient le score ML de viabilité du projet.
type SuccessPrediction struct {
	Score      int                `json:"successScore"`
	Confidence string             `json:"confidence"`
	Factors    []PredictionFactor `json:"factors"`
	Source     string             `json:"source"`
}

// AnalyzeResult regroupe pitch IA et prédiction ML.
type AnalyzeResult struct {
	Response   *PitchResponse
	Prediction *SuccessPrediction
}

// AnalyzePitchRequest est le corps JSON de POST /api/analyze-pitch.
type AnalyzePitchRequest struct {
	Country     string `json:"country"`
	Sector      string `json:"sector"`
	Audience    string `json:"audience"`
	Description string `json:"description"`
}

// AnalyzePitchResponse est la réponse JSON de l'API.
type AnalyzePitchResponse struct {
	Probleme     string             `json:"probleme"`
	Solution     string             `json:"solution"`
	Marche       string             `json:"marche"`
	Valeur       string             `json:"valeur"`
	Canaux       string             `json:"canaux"`
	Modele       string             `json:"modele"`
	ContextLabel string             `json:"contextLabel"`
	UserInput    string             `json:"userInput"`
	SuccessScore *int               `json:"successScore,omitempty"`
	Confidence   string             `json:"confidence,omitempty"`
	Factors            []PredictionFactor  `json:"factors,omitempty"`
	ConsultantInsights *ConsultantInsights `json:"consultantInsights,omitempty"`
}
