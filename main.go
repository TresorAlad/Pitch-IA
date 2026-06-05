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
	_ = godotenv.Load(".env")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8088"
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      routes.Handler(),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 90 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	log.Printf("API Pitch-IA sur :%s", port)
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Erreur lors du démarrage du serveur: %v", err)
	}
}
