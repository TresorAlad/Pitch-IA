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

**Proxy Vercel (recommandé)** — évite « Failed to fetch » (blocage HTTPS→HTTP) :

1. Éditer `frontend/vercel.json` : IP EC2 dans les rewrites (`13.53.84.222` → la vôtre)
2. Sur Vercel : **supprimer** `VITE_API_URL` (le frontend appelle `/api/...` sur le même domaine)
3. **Redéployer**

Alternative : API en HTTPS (`VITE_API_URL=https://api.domaine.com` + Caddy sur EC2).

Voir `frontend/.env.production.example`.

## 5. CORS

Sur EC2, `CORS_ORIGINS` doit contenir **exactement** l'origine Vercel :

```
https://votre-projet.vercel.app
```

Pour les previews Vercel, ajoutez chaque URL ou un domaine custom.

## 6. Dépannage « 502 » sur Vercel (proxy)

Le proxy `frontend/vercel.json` renvoie **502** si Vercel **ne peut pas joindre** l'EC2.

**Vérifications (dans l'ordre) :**

```bash
# Sur la VM — API locale OK ?
curl http://localhost:8088/health

# IP publique actuelle (console AWS → Public IPv4)
curl http://IP_PUBLIQUE:8088/health

# Depuis votre PC (pas la VM)
curl http://IP_PUBLIQUE:8088/health

# Via le proxy Vercel
curl https://pitch-ia.vercel.app/health
```

| Symptôme | Cause | Action |
|----------|-------|--------|
| Local OK, IP publique KO | Security Group / `ufw` | Ouvrir **TCP 8088** entrée `0.0.0.0/0` |
| IP publique OK, Vercel `/health` 502 | IP obsolète dans `vercel.json` | Mettre à jour l'IP + redéployer |
| `/health` OK, `/api/analyze-pitch` 502 | Timeout backend | Vérifier logs Docker ; Groq &lt; 2 min |

```bash
sudo ufw allow 8088/tcp   # si ufw actif
```

## 7. HTTPS (recommandé en prod)

Exposez le port 8088 derrière **Nginx** ou **Caddy** sur le même EC2 avec Let's Encrypt, puis utilisez `https://api.domaine.com` dans `VITE_API_URL`.

Exemple Caddy (hors conteneur) :

```
api.domaine.com {
  reverse_proxy localhost:8088
}
```

## 8. Mise à jour

```bash
git pull
docker compose -f docker-compose.ec2.yml up -d --build
```

## Build manuel (sans compose)

```bash
docker build -f Dockerfile.ec2 -t pitch-ia:ec2 .
docker run -d --name pitch-ia -p 8088:8088 --env-file .env --restart unless-stopped pitch-ia:ec2
```
