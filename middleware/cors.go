package middleware

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
)

func allowedOrigin(origin string) bool {
	if origin == "" {
		return false
	}
	allowed := os.Getenv("CORS_ORIGINS")
	if allowed == "" {
		return strings.HasPrefix(origin, "http://localhost:") || strings.HasPrefix(origin, "http://127.0.0.1:")
	}
	for _, o := range strings.Split(allowed, ",") {
		if strings.TrimSpace(o) == origin {
			return true
		}
	}
	return false
}

func setCORSHeaders(w http.ResponseWriter, origin string) {
	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept")
	w.Header().Set("Access-Control-Max-Age", "86400")
}

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// CORS autorise le frontend React (dev et prod) + preflight OPTIONS.
func CORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if allowedOrigin(origin) {
			setCORSHeaders(w, origin)
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next(w, r)
	}
}

// WithMethod n'autorise que la méthode indiquée ; OPTIONS et réponses JSON gérés ici.
func WithMethod(method string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if allowedOrigin(origin) {
			setCORSHeaders(w, origin)
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		if r.Method != method {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
				"error": "Méthode non autorisée. Utilisez " + method + ".",
			})
			return
		}

		next(w, r)
	}
}
