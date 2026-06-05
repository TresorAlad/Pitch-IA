package routes

import (
	"net/http"
	"pitch/controllers"
	"pitch/middleware"
)

func loggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				http.Error(w, "Erreur interne du serveur", http.StatusInternalServerError)
			}
		}()
		next(w, r)
	}
}

func HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok","service":"pitch-ia-api"}`))
}

func Web() {
	http.HandleFunc("/health", middleware.CORS(HealthCheck))
	http.HandleFunc("/api/analyze-pitch", middleware.CORS(loggingMiddleware(controllers.AnalyzePitch)))
}
