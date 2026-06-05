package routes

import (
	"encoding/json"
	"net/http"
	"pitch/controllers"
	"pitch/middleware"
)

func loggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if recover() != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				_ = json.NewEncoder(w).Encode(map[string]string{"error": "Erreur interne du serveur"})
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

// Handler retourne le routeur HTTP (Go 1.22+).
func Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", middleware.CORS(HealthCheck))
	mux.HandleFunc("/api/analyze-pitch", middleware.WithMethod(
		http.MethodPost,
		loggingMiddleware(controllers.AnalyzePitch),
	))
	return mux
}
