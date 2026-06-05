package service

import (
	"context"
	"fmt"
	"pitch/models"
	"strings"
	"time"

	openai "github.com/sashabaranov/go-openai"
)

const insightsFormatRules = `Réponds UNIQUEMENT avec ces 4 lignes (pas de texte avant ni après) :
[Tendances IT] ...
[KPIs 90j] ...
[Risques] ...
[Prochaines étapes] ...`

func buildInsightsSystemPrompt() string {
	return `Tu es un associé en conseil digital senior (UEMOA + veille tech mondiale).
Tu produis des insights actionnables pour un fondateur : tendances IT traduites localement, KPIs 90j,
risques réalistes, prochaines étapes concrètes. Pas de buzzwords sans lien avec le projet décrit.

` + insightsFormatRules
}

func buildInsightsUserPrompt(ctx models.PitchContext, techBrief string) string {
	country := strings.TrimSpace(ctx.Country)
	if country == "" {
		country = "UEMOA"
	}
	sector := strings.TrimSpace(ctx.Sector)
	audience := strings.TrimSpace(ctx.Audience)
	if audience == "" {
		audience = "investisseur"
	}

	return strings.TrimSpace(fmt.Sprintf(`Produis le bloc INSIGHTS CONSULTANT pour ce projet précis.

Description (source principale) :
%s

Contexte : %s · secteur %s · cible %s
Ton : %s

Veille tech récente (inspiration — n'utiliser que ce qui s'applique au projet) :
%s

Chaque ligne doit aider CE fondateur, pas un autre secteur générique.`,
		strings.TrimSpace(ctx.Description),
		country,
		sector,
		audience,
		audienceGuidance(audience),
		techBrief,
	))
}

func insightsComplete(ins *models.ConsultantInsights) bool {
	if ins == nil {
		return false
	}
	return ins.TendancesIT != "" && ins.Kpis90j != "" && ins.Risques != "" && ins.ProchainesEtapes != ""
}

// GenerationConsultantInsights appelle Groq pour le bloc consultant (appel dédié + veille tech).
func GenerationConsultantInsights(pitchCtx models.PitchContext) *models.ConsultantInsights {
	if strings.TrimSpace(pitchCtx.Description) == "" {
		return nil
	}
	apiKey := aiAPIKey()
	if apiKey == "" {
		return nil
	}

	techBrief := FetchTechTrendsBrief()
	client := newAIClient(apiKey)
	system := buildInsightsSystemPrompt()
	prompt := buildInsightsUserPrompt(pitchCtx, techBrief)

	for attempt := 1; attempt <= 2; attempt++ {
		if attempt > 1 {
			time.Sleep(time.Duration(attempt) * time.Second)
		}

		reqCtx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
		resp, err := client.CreateChatCompletion(
			reqCtx,
			openai.ChatCompletionRequest{
				Model: aiModel(),
				Messages: []openai.ChatCompletionMessage{
					{Role: openai.ChatMessageRoleSystem, Content: system},
					{Role: openai.ChatMessageRoleUser, Content: prompt},
				},
				Temperature: 0.65,
				MaxTokens:   700,
			},
		)
		cancel()

		if err != nil {
			if strings.Contains(err.Error(), "401") || strings.Contains(err.Error(), "authentication") {
				return nil
			}
			continue
		}
		if len(resp.Choices) == 0 {
			continue
		}
		content := strings.TrimSpace(resp.Choices[0].Message.Content)
		if content == "" {
			continue
		}
		insights := parseConsultantInsights(content)
		if insightsComplete(insights) {
			return insights
		}
		if insights != nil && (insights.TendancesIT != "" || insights.Kpis90j != "") {
			return insights
		}
	}
	return nil
}
