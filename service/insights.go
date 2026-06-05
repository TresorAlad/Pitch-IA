package service

import (
	"pitch/models"
	"strings"
)

const insightsDelimiter = "--- INSIGHTS CONSULTANT ---"

func splitPitchAndInsights(content string) (pitchPart, insightsPart string) {
	content = strings.TrimSpace(content)
	idx := strings.Index(content, insightsDelimiter)
	if idx >= 0 {
		return strings.TrimSpace(content[:idx]), strings.TrimSpace(content[idx+len(insightsDelimiter):])
	}
	lower := strings.ToLower(content)
	if pos := strings.Index(lower, "[tendances it]"); pos > 0 {
		return strings.TrimSpace(content[:pos]), strings.TrimSpace(content[pos:])
	}
	return content, ""
}

func parseConsultantInsights(block string) *models.ConsultantInsights {
	block = strings.TrimSpace(block)
	if block == "" {
		return nil
	}

	result := &models.ConsultantInsights{}
	lines := strings.Split(block, "\n")

	assign := func(line string, key string) {
		lower := strings.ToLower(line)
		tag := "[" + key + "]"
		if !strings.HasPrefix(lower, tag) {
			return
		}
		text := strings.TrimSpace(line[len(tag):])
		text = strings.TrimLeft(text, ":–—- ")
		switch key {
		case "tendances it":
			if result.TendancesIT == "" {
				result.TendancesIT = text
			} else {
				result.TendancesIT += " " + text
			}
		case "kpis 90j":
			if result.Kpis90j == "" {
				result.Kpis90j = text
			} else {
				result.Kpis90j += " " + text
			}
		case "risques":
			if result.Risques == "" {
				result.Risques = text
			} else {
				result.Risques += " " + text
			}
		case "prochaines étapes":
			if result.ProchainesEtapes == "" {
				result.ProchainesEtapes = text
			} else {
				result.ProchainesEtapes += " " + text
			}
		}
	}

	currentKey := ""
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		lower := strings.ToLower(trimmed)
		switch {
		case strings.HasPrefix(lower, "[tendances it]"):
			currentKey = "tendances it"
			assign(trimmed, currentKey)
		case strings.HasPrefix(lower, "[kpis 90j]"):
			currentKey = "kpis 90j"
			assign(trimmed, currentKey)
		case strings.HasPrefix(lower, "[risques]"):
			currentKey = "risques"
			assign(trimmed, currentKey)
		case strings.HasPrefix(lower, "[prochaines étapes]"), strings.HasPrefix(lower, "[prochaines etapes]"):
			currentKey = "prochaines étapes"
			assign(trimmed, "prochaines étapes")
		default:
			if currentKey != "" {
				switch currentKey {
				case "tendances it":
					result.TendancesIT = strings.TrimSpace(result.TendancesIT + " " + trimmed)
				case "kpis 90j":
					result.Kpis90j = strings.TrimSpace(result.Kpis90j + " " + trimmed)
				case "risques":
					result.Risques = strings.TrimSpace(result.Risques + " " + trimmed)
				case "prochaines étapes":
					result.ProchainesEtapes = strings.TrimSpace(result.ProchainesEtapes + " " + trimmed)
				}
			}
		}
	}

	if result.TendancesIT == "" && result.Kpis90j == "" && result.Risques == "" && result.ProchainesEtapes == "" {
		return nil
	}
	return result
}
