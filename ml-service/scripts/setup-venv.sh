#!/usr/bin/env bash
# Crée un venv Python 3.12 avec toutes les deps dont MLflow
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

if ! command -v python3.12 &>/dev/null; then
  echo "Erreur : python3.12 est requis pour MLflow (pyarrow)."
  echo "Installez-le : sudo apt install python3.12 python3.12-venv"
  exit 1
fi

echo "→ Création du venv avec Python 3.12..."
rm -rf .venv
python3.12 -m venv .venv
source .venv/bin/activate

echo "→ Installation des dépendances..."
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-mlflow.txt
python -m spacy download fr_core_news_sm

echo "→ Entraînement + MLflow..."
python training/train.py

echo ""
echo "✓ Environnement prêt. Pour lancer le service ML :"
echo "  source .venv/bin/activate && uvicorn main:app --port 8090"
echo ""
echo "Pour l'UI MLflow :"
echo "  source .venv/bin/activate && mlflow ui --backend-store-uri mlruns --port 5000"
