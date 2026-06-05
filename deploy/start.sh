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

echo "[start] Attente du service ML..."
i=0
while [ "$i" -lt 90 ]; do
  if curl -sf "http://127.0.0.1:${ML_PORT}/health" >/dev/null 2>&1; then
    echo "[start] ML prêt."
    break
  fi
  i=$((i + 1))
  sleep 2
done

if ! curl -sf "http://127.0.0.1:${ML_PORT}/health" >/dev/null 2>&1; then
  echo "[start] ERREUR: le service ML ne répond pas." >&2
  exit 1
fi

echo "[start] Démarrage API Go (port ${PORT:-8088})..."
cd /app
exec ./pitch
