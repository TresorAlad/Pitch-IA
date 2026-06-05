# 🚀 Pitch-IA - Brouillon de pitch intelligent (UEMOA)

Pitch-IA transforme une idée de projet en **brouillon de pitch structuré en 6 sections** et un **score de viabilité ML**, pensé pour les fondateurs **Afrique de l'Ouest (UEMOA)**.

> One-pager incubateurs : [`docs/ONE_PAGER_INCUBATEURS.md`](docs/ONE_PAGER_INCUBATEURS.md)

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Go](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-000000?style=for-the-badge&logo=data:image/svg+xml&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## Architecture

```text
frontend/ (React + Vite)  →  app/ (API Go)  →  Groq (pitch + insights) + ml-service/ (score)
```

| Couche | Technologie | Rôle |
|--------|-------------|------|
| Frontend | React 19, Vite, TypeScript, Tailwind | UI, formulaire, jauge ML, résultats |
| API | Go 1.22 | REST JSON, orchestration IA + ML |
| IA | Groq API (`llama-3.3-70b-versatile`) | Génération des 6 sections de pitch + insights consultant |
| ML | LightGBM, spaCy, SHAP, MLflow, Beautiful Soup | Score, NLP FR, explications, tracking |

## Fonctionnalités

* Contexte UEMOA (pays, secteur, public cible)
* Orchestration automatique : pitch + insights (Groq) et score LightGBM ; si Groq échoue, secours ML (SHAP + spaCy + données marché UEMOA, pas de texte générique)
* Score de réussite **LightGBM** avec analyse **spaCy (FR)**
* Facteurs explicatifs automatiques via **SHAP**
* Données marché UEMOA via **Beautiful Soup**
* Suivi des entraînements via **MLflow** (`ml-service/mlruns/`)
* Interface React responsive

## Installation locale

### Prérequis

* Go 1.22+, Node.js 20+, Python 3.12+
* Clé API [Groq](https://console.groq.com/keys)

### Option A - Docker Compose (recommandé)

Une commande lance **ML + API Go + frontend** — pas besoin de `go run` ni `npm run dev`.

```bash
cp .env.example .env
# Renseigner GROQ_API_KEY dans .env
docker compose up --build -d
# ou : bash scripts/docker-up.sh
```

| URL | Rôle |
|-----|------|
| [http://localhost:3000](http://localhost:3000) | Application (nginx → API) |
| [http://localhost:8090/health](http://localhost:8090/health) | ML (debug) |

```bash
docker compose logs -f    # suivre les logs
docker compose down       # arrêter
```

> Arrêtez un `go run main.go` local avant Docker si le port 8088 est occupé sur l'hôte (le conteneur API n'expose pas 8088 vers l'hôte, seul le frontend sur 3000).

### Production : EC2 (backend) + Vercel (frontend)

Un **seul conteneur** sur EC2 (API Go + ML). Le frontend React est sur Vercel.

```bash
cp .env.ec2.example .env
# Renseigner GROQ_API_KEY, GROQ_MODEL (llama-3.3-70b-versatile) et CORS_ORIGINS (URL Vercel)
docker compose -f docker-compose.ec2.yml up -d --build
```

Sur Vercel : variable `VITE_API_URL` = URL publique de l'API (HTTPS, sans slash final).

Guide détaillé : [docs/DEPLOY_EC2.md](docs/DEPLOY_EC2.md)

### Option B - Développement (3 terminaux)

**Terminal 1 - ML (Python 3.12 requis pour MLflow) :**
```bash
cd ml-service
bash scripts/setup-venv.sh   # crée .venv 3.12 + MLflow + entraîne le modèle
source .venv/bin/activate
uvicorn main:app --port 8090
```

**UI MLflow** (visualiser les runs) :
```bash
cd ml-service && source .venv/bin/activate
mlflow ui --backend-store-uri mlruns --port 5000
# → http://localhost:5000
```

**Terminal 2 - API Go :**
```bash
cp .env.example .env
go run main.go
```

**Terminal 3 - Frontend React :**
```bash
cd frontend && npm install && npm run dev
```

Frontend : `http://localhost:5173` (proxy `/api` → `:8088`)

## Structure du projet

```text
.
├── frontend/           # React + Vite + Tailwind
│   ├── src/
│   │   ├── api/      # Client REST
│   │   ├── components/
│   │   └── types/
│   └── Dockerfile    # nginx (prod)
├── controllers/      # Handlers API JSON
├── middleware/       # CORS
├── models/
├── routes/
├── service/          # Groq + client ML
├── ml-service/       # Microservice Python
│   ├── scripts/setup-venv.sh  # venv Python 3.12 + MLflow
│   ├── ml/mlflow_tracker.py
│   ├── mlruns/              # Historique MLflow (généré)
├── docker-compose.yml
└── Dockerfile        # API Go
```

## API

### `POST /api/analyze-pitch`

```json
{
  "country": "ci",
  "sector": "FinTech",
  "audience": "investisseur",
  "description": "Plateforme de micro-crédit Mobile Money..."
}
```

### `GET /market-data` (ml-service)

Données marché parsées depuis `ml-service/data/market_uemoa.html` avec **Beautiful Soup**.
Query params optionnels : `?country=ci&sector=FinTech`

### `GET /health`

Health check de l'API Go.

## Déploiement

- **Docker Compose** : stack complète (frontend + API + ML) en local
- **EC2** : backend mono-conteneur (API Go + ML) — voir [docs/DEPLOY_EC2.md](docs/DEPLOY_EC2.md)
- **Vercel** : frontend React ; `VITE_API_URL` pointe vers l'API EC2 (HTTPS)

## Licence

MIT
