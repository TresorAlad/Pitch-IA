#!/usr/bin/env bash
# Lance Pitch-IA en Docker (ML + API + frontend)
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "Créez .env depuis .env.example et renseignez GROQ_API_KEY"
  cp -n .env.example .env 2>/dev/null || true
  exit 1
fi

echo "→ Arrêt des processus locaux sur 8088 (si présents)..."
fuser -k 8088/tcp 2>/dev/null || true

echo "→ Démarrage Docker Compose..."
docker compose up --build -d

echo ""
echo "  Application : http://localhost:3000"
echo "  ML health   : http://localhost:8090/health"
echo "  Logs        : docker compose logs -f"
echo "  Arrêt       : docker compose down"
