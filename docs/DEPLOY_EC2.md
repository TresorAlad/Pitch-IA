# Déploiement AWS EC2 + Vercel

Architecture :

- **Vercel** : frontend React (`frontend/`)
- **EC2** : un conteneur Docker (`Dockerfile.ec2`) = API Go `:8088` + ML `:8090` (interne)

## 1. Prérequis EC2

- Instance Ubuntu 22.04+ (min. 2 Go RAM, 4 Go recommandé pour spaCy/LightGBM)
- Docker + Docker Compose installés
- Groupe de sécurité : autoriser **TCP 8088** (entrée) depuis Internet ou depuis Vercel uniquement si possible

## 2. Installation sur le serveur

```bash
git clone <votre-repo> pitch-ia
cd pitch-ia
cp .env.ec2.example .env
# Éditer .env : GROQ_API_KEY, GROQ_MODEL, CORS_ORIGINS (URL Vercel)
```

## 3. Lancer le conteneur unique

```bash
docker compose -f docker-compose.ec2.yml up -d --build
```

Vérification :

```bash
curl http://localhost:8088/health
# {"status":"ok","service":"pitch-ia-api"}
```

Logs :

```bash
docker compose -f docker-compose.ec2.yml logs -f
```

## 4. Vercel (frontend)

Dans **Project Settings → General** :

| Paramètre | Valeur |
|-----------|--------|
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Variables (**Settings → Environment Variables**) :

- `VITE_API_URL` = `http://IP_PUBLIQUE_EC2:8088` (sans `/api`, sans slash final)
- Cochez **Production** et **Preview**
- **Redéployer** après chaque changement (obligatoire : Vite compile la variable au build)

> Ne pas utiliser l’ancien `vercel.json` Go à la racine : l’API tourne sur EC2, pas sur Vercel.

> **HTTPS** : le site Vercel est en `https://`. Un appel direct vers `http://IP:8088` est souvent **bloqué** par le navigateur (mixed content). Préférez HTTPS sur l'API (Caddy + domaine) ou un reverse proxy.

Voir `frontend/.env.production.example`.

## 5. CORS

Sur EC2, `CORS_ORIGINS` doit contenir **exactement** l'origine Vercel :

```
https://votre-projet.vercel.app
```

Pour les previews Vercel, ajoutez chaque URL ou un domaine custom.

## 6. HTTPS (recommandé)

Exposez le port 8088 derrière **Nginx** ou **Caddy** sur le même EC2 avec Let's Encrypt, puis utilisez `https://api.domaine.com` dans `VITE_API_URL`.

Exemple Caddy (hors conteneur) :

```
api.domaine.com {
  reverse_proxy localhost:8088
}
```

## 7. Mise à jour

```bash
git pull
docker compose -f docker-compose.ec2.yml up -d --build
```

## Build manuel (sans compose)

```bash
docker build -f Dockerfile.ec2 -t pitch-ia:ec2 .
docker run -d --name pitch-ia -p 8088:8088 --env-file .env --restart unless-stopped pitch-ia:ec2
```
