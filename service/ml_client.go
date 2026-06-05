package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"pitch/models"
)

const mlTimeout = 20 * time.Second

type mlPitchRequest struct {
	Country     string `json:"country"`
	Sector      string `json:"sector"`
	Audience    string `json:"audience"`
	Description string `json:"description"`
}

type mlSuccessResponse struct {
	SuccessScore int                       `json:"successScore"`
	Confidence   string                    `json:"confidence"`
	Factors      []models.PredictionFactor `json:"factors"`
	Source       string                    `json:"source"`
}

type mlPitchResponse struct {
	Probleme           string                     `json:"probleme"`
	Solution           string                     `json:"solution"`
	Marche             string                     `json:"marche"`
	Valeur             string                     `json:"valeur"`
	Canaux             string                     `json:"canaux"`
	Modele             string                     `json:"modele"`
	Source             string                     `json:"source"`
	ConsultantInsights *models.ConsultantInsights `json:"consultantInsights"`
}

type mlInsightsResponse struct {
	TendancesIT      string `json:"tendancesIT"`
	Kpis90j          string `json:"kpis90j"`
	Risques          string `json:"risques"`
	ProchainesEtapes string `json:"prochainesEtapes"`
}

func mlServiceURL() string {
	url := strings.TrimSpace(os.Getenv("ML_SERVICE_URL"))
	if url == "" {
		return "http://localhost:8090"
	}
	url = strings.TrimRight(url, "/")
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		url = "http://" + url
	}
	return url
}

func buildMLRequest(ctx models.PitchContext, countryCode string) mlPitchRequest {
	return mlPitchRequest{
		Country:     countryCode,
		Sector:      ctx.Sector,
		Audience:    ctx.Audience,
		Description: ctx.Description,
	}
}

func postML(endpoint string, payload mlPitchRequest, dest interface{}) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	client := &http.Client{Timeout: mlTimeout}
	req, err := http.NewRequest(http.MethodPost, mlServiceURL()+endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("ml service %s returned %d", endpoint, resp.StatusCode)
	}

	return json.NewDecoder(resp.Body).Decode(dest)
}

// PredictSuccess appelle le microservice ML pour le score de réussite.
func PredictSuccess(ctx models.PitchContext, countryCode string) (*models.SuccessPrediction, error) {
	var result mlSuccessResponse
	if err := postML("/predict-success", buildMLRequest(ctx, countryCode), &result); err != nil {
		return nil, err
	}
	return &models.SuccessPrediction{
		Score:      result.SuccessScore,
		Confidence: result.Confidence,
		Factors:    result.Factors,
		Source:     result.Source,
	}, nil
}

// SynthesizePitchML génère pitch + insights via le pipeline ML (LightGBM, SHAP, spaCy, marché UEMOA).
func SynthesizePitchML(ctx models.PitchContext, countryCode string) (*models.PitchResponse, error) {
	var result mlPitchResponse
	if err := postML("/synthesize-pitch", buildMLRequest(ctx, countryCode), &result); err != nil {
		return nil, err
	}
	return &models.PitchResponse{
		Probleme: result.Probleme,
		Solution: result.Solution,
		Marche:   result.Marche,
		Valeur:   result.Valeur,
		Canaux:   result.Canaux,
		Modele:   result.Modele,
		Insights: result.ConsultantInsights,
	}, nil
}

// SynthesizeInsightsML génère uniquement les insights consultant via le pipeline ML.
func SynthesizeInsightsML(ctx models.PitchContext, countryCode string) (*models.ConsultantInsights, error) {
	var result mlInsightsResponse
	if err := postML("/synthesize-insights", buildMLRequest(ctx, countryCode), &result); err != nil {
		return nil, err
	}
	return &models.ConsultantInsights{
		TendancesIT:      result.TendancesIT,
		Kpis90j:          result.Kpis90j,
		Risques:          result.Risques,
		ProchainesEtapes: result.ProchainesEtapes,
	}, nil
}

func mergeInsights(primary, fallback *models.ConsultantInsights) *models.ConsultantInsights {
	if insightsComplete(primary) {
		return primary
	}
	if primary == nil {
		return fallback
	}
	if fallback == nil {
		return primary
	}
	out := &models.ConsultantInsights{}
	if primary.TendancesIT != "" {
		out.TendancesIT = primary.TendancesIT
	} else {
		out.TendancesIT = fallback.TendancesIT
	}
	if primary.Kpis90j != "" {
		out.Kpis90j = primary.Kpis90j
	} else {
		out.Kpis90j = fallback.Kpis90j
	}
	if primary.Risques != "" {
		out.Risques = primary.Risques
	} else {
		out.Risques = fallback.Risques
	}
	if primary.ProchainesEtapes != "" {
		out.ProchainesEtapes = primary.ProchainesEtapes
	} else {
		out.ProchainesEtapes = fallback.ProchainesEtapes
	}
	if out.TendancesIT == "" && out.Kpis90j == "" && out.Risques == "" && out.ProchainesEtapes == "" {
		return nil
	}
	return out
}

// AnalyzePitchParallel : Groq en priorité ; secours ML (pipeline réel) si l'IA échoue.
func AnalyzePitchParallel(ctx models.PitchContext, countryCode string) models.AnalyzeResult {
	result := models.AnalyzeResult{}

	type mlOutcome struct {
		pred *models.SuccessPrediction
		err  error
	}
	type pitchOutcome struct {
		resp *models.PitchResponse
	}
	type insightsOutcome struct {
		insights *models.ConsultantInsights
	}

	mlCh := make(chan mlOutcome, 1)
	pitchCh := make(chan pitchOutcome, 1)
	insightsCh := make(chan insightsOutcome, 1)

	go func() {
		defer func() {
			if recover() != nil {
				mlCh <- mlOutcome{nil, fmt.Errorf("ml prediction panic")}
			}
		}()
		pred, err := PredictSuccess(ctx, countryCode)
		mlCh <- mlOutcome{pred, err}
	}()

	go func() {
		defer func() {
			if recover() != nil {
				pitchCh <- pitchOutcome{nil}
			}
		}()
		pitchCh <- pitchOutcome{GenerationWithAI(ctx)}
	}()

	go func() {
		defer func() {
			if recover() != nil {
				insightsCh <- insightsOutcome{nil}
			}
		}()
		insightsCh <- insightsOutcome{GenerationConsultantInsights(ctx)}
	}()

	mlRes := <-mlCh
	if mlRes.err == nil {
		result.Prediction = mlRes.pred
	}

	insightsRes := <-insightsCh
	pitchRes := <-pitchCh

	if pitchRes.resp != nil {
		insights := mergeInsights(insightsRes.insights, nil)
		if !insightsComplete(insights) {
			if mlIns, err := SynthesizeInsightsML(ctx, countryCode); err == nil {
				insights = mergeInsights(insights, mlIns)
			}
		}
		pitchRes.resp.Insights = insights
		result.Response = pitchRes.resp
		return result
	}

	// Secours : synthèse ML (LightGBM + SHAP + spaCy + marché UEMOA)
	synth, err := SynthesizePitchML(ctx, countryCode)
	if err == nil && synth != nil {
		synth.Insights = mergeInsights(insightsRes.insights, synth.Insights)
		result.Response = synth
	}
	return result
}
