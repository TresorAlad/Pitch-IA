package main

import (
	"log"
	"net/http"
	"os"
	"pitch/routes"
	"time"

	"github.com/joho/godotenv"
)

func main() {
	// Charger les variables d'environnement depuis .env (optionnel, pour le développement local)
	_ = godotenv.Load(".env")

	// Configurer les routes
	routes.Web()

	// Lire le port depuis la variable d'environnement PORT (défaut 8088)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8088"
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      nil,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 90 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Erreur lors du démarrage du serveur: %v", err)
	}
}
