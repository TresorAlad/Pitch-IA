package service

import (
	"os"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

const (
	groqBaseURL      = "https://api.groq.com/openai/v1"
	defaultGroqModel = "llama-3.3-70b-versatile"
	groqAPIKeyPrefix = "gsk_"
)

// AIAPIKeyForErrors expose la clé pour les messages d'erreur HTTP.
func AIAPIKeyForErrors() string {
	return aiAPIKey()
}

// IsValidAIAPIKey vérifie le préfixe Groq (gsk_).
func IsValidAIAPIKey(key string) bool {
	return isValidAIAPIKey(key)
}

func aiAPIKey() string {
	return strings.TrimSpace(os.Getenv("GROQ_API_KEY"))
}

func aiModel() string {
	if model := strings.TrimSpace(os.Getenv("GROQ_MODEL")); model != "" {
		return model
	}
	return defaultGroqModel
}

func isValidAIAPIKey(key string) bool {
	return strings.HasPrefix(key, groqAPIKeyPrefix)
}

func newAIClient(apiKey string) *openai.Client {
	cfg := openai.DefaultConfig(apiKey)
	cfg.BaseURL = groqBaseURL
	return openai.NewClientWithConfig(cfg)
}
