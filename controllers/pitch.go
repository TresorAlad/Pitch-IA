package controllers

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"pitch/models"
	"pitch/service"
)

var allowedCountries = map[string]string{
	"ci":    "Côte d'Ivoire",
	"sn":    "Sénégal",
	"ml":    "Mali",
	"bf":    "Burkina Faso",
	"ne":    "Niger",
	"tg":    "Togo",
	"bj":    "Bénin",
	"gw":    "Guinée-Bissau",
	"uemoa": "UEMOA (toute la zone)",
}

var allowedSectors = map[string]bool{
	"FinTech": true, "AgriTech": true, "EdTech": true, "HealthTech": true,
	"FoodTech": true, "LogisTech": true, "E-commerce": true, "SaaS B2B": true,
	"CleanTech": true, "Mobility": true, "Autre": true,
}

var allowedAudiences = map[string]bool{
	"investisseur": true, "client": true, "partenaire": true, "incubateur": true,
}

var audienceLabels = map[string]string{
	"investisseur": "Investisseur",
	"client":       "Client final",
	"partenaire":   "Partenaire B2B",
	"incubateur":   "Incubateur / jury",
}

func buildContextLabel(country, sector, audience string) string {
	parts := []string{}
	if label, ok := allowedCountries[country]; ok {
		parts = append(parts, label)
	} else if country != "" {
		parts = append(parts, country)
	}
	if sector != "" {
		parts = append(parts, sector)
	}
	if label, ok := audienceLabels[audience]; ok {
		parts = append(parts, label)
	}
	return strings.Join(parts, " · ")
}

func normalizeRequest(req *models.AnalyzePitchRequest) {
	req.Country = strings.TrimSpace(req.Country)
	req.Sector = strings.TrimSpace(req.Sector)
	req.Audience = strings.TrimSpace(req.Audience)
	req.Description = strings.TrimSpace(req.Description)

	if _, ok := allowedCountries[req.Country]; !ok {
		req.Country = "uemoa"
	}
	if !allowedSectors[req.Sector] {
		req.Sector = "Autre"
	}
	if !allowedAudiences[req.Audience] {
		req.Audience = "investisseur"
	}
}

func pitchContextFromRequest(req models.AnalyzePitchRequest) models.PitchContext {
	countryLabel := allowedCountries[req.Country]
	if countryLabel == "" {
		countryLabel = req.Country
	}
	return models.PitchContext{
		Description: req.Description,
		Country:     countryLabel,
		Sector:      req.Sector,
		Audience:    req.Audience,
	}
}

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// AnalyzePitch traite POST /api/analyze-pitch (JSON).
func AnalyzePitch(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if err := recover(); err != nil {
			writeError(w, http.StatusInternalServerError, "Erreur interne du serveur")
		}
	}()

	r.Body = http.MaxBytesReader(w, r.Body, 10240)
	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Corps de requête invalide")
		return
	}

	var req models.AnalyzePitchRequest
	if err := json.Unmarshal(body, &req); err != nil {
		writeError(w, http.StatusBadRequest, "JSON invalide")
		return
	}

	normalizeRequest(&req)

	if req.Description == "" {
		writeError(w, http.StatusBadRequest, "Veuillez décrire votre projet.")
		return
	}
	if len(req.Description) < 10 {
		writeError(w, http.StatusBadRequest, "La description doit contenir au moins 10 caractères.")
		return
	}
	if len(req.Description) > 2000 {
		writeError(w, http.StatusBadRequest, "La description ne doit pas dépasser 2000 caractères.")
		return
	}

	pitchCtx := pitchContextFromRequest(req)
	analyzeResult := service.AnalyzePitchParallel(pitchCtx, req.Country)

	if analyzeResult.Response == nil {
		apiKey := service.AIAPIKeyForErrors()
		var message string
		switch {
		case apiKey == "":
			message = "⚠️ Clé Groq manquante. Définissez GROQ_API_KEY dans .env."
		case !service.IsValidAIAPIKey(apiKey):
			message = "⚠️ Clé Groq invalide (préfixe gsk_ attendu)."
		default:
			message = "⚠️ L'IA Groq et le secours ML ont échoué. Vérifiez GROQ_API_KEY / GROQ_MODEL et que le service ML tourne (ML_SERVICE_URL, port 8090)."
		}
		writeError(w, http.StatusInternalServerError, message)
		return
	}

	response := models.AnalyzePitchResponse{
		Probleme:     analyzeResult.Response.Probleme,
		Solution:     analyzeResult.Response.Solution,
		Marche:       analyzeResult.Response.Marche,
		Valeur:       analyzeResult.Response.Valeur,
		Canaux:       analyzeResult.Response.Canaux,
		Modele:       analyzeResult.Response.Modele,
		ContextLabel: buildContextLabel(req.Country, req.Sector, req.Audience),
		UserInput:    req.Description,
		ConsultantInsights: analyzeResult.Response.Insights,
	}

	if analyzeResult.Prediction != nil {
		score := analyzeResult.Prediction.Score
		response.SuccessScore = &score
		response.Confidence = analyzeResult.Prediction.Confidence
		response.Factors = analyzeResult.Prediction.Factors
	}

	writeJSON(w, http.StatusOK, response)
}
