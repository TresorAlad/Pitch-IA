#!/bin/sh
set -eu

ML_PORT="${ML_PORT:-8090}"

export ML_SERVICE_URL="http://127.0.0.1:${ML_PORT}"

if [ ! -f /app/ml-service/models/success_model.joblib ]; then
  echo "[start] Modèle absent, entraînement..."
  cd /app/ml-service && python training/train.py
fi

echo "[start] Démarrage ML (port ${ML_PORT})..."
cd /app/ml-service
uvicorn main:app --host 127.0.0.1 --port "${ML_PORT}" &
ML_PID=$!

cleanup() {
  echo "[start] Arrêt des services..."
  kill "${ML_PID}" 2>/dev/null || true
}
trap cleanup INT TERM

# Attente ML en arrière-plan — l'API Go démarre tout de suite (health sur :8088)
(
  i=0
  while [ "$i" -lt 120 ]; do
    if curl -sf "http://127.0.0.1:${ML_PORT}/health" >/dev/null 2>&1; then
      echo "[start] ML prêt."
      exit 0
    fi
    i=$((i + 1))
    sleep 2
  done
  echo "[start] AVERTISSEMENT: ML pas encore prêt (score indisponible temporairement)." >&2
) &

echo "[start] Démarrage API Go (port ${PORT:-8088})..."
cd /app
exec ./pitch
