# 🚀 Pitch-IA - Générateur de Pitch Intelligent

Pitch-IA est une application web moderne développée en **Go** qui utilise l'intelligence artificielle (**OpenAI**) pour transformer une simple idée de projet en un pitch structuré, professionnel et convaincant.

![Go](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Fonctionnalités

*   **Analyse Contextuelle** : Transforme une description courte en un argumentaire complet.
*   **Structure Professionnelle** : Génère automatiquement les 6 sections clés :
    1.  **Problème** : Identification claire du besoin.
    2.  **Solution** : Proposition concrète.
    3.  **Marché** : Ciblage et opportunités.
    4.  **Valeur Unique** : Pourquoi votre projet se démarque.
    5.  **Canaux** : Stratégie d'acquisition.
    6.  **Modèle Économique** : Comment le projet génère des revenus.
*   **Interface Réactive** : Design moderne avec Tailwind CSS, optimisé pour mobile et desktop.
*   **Robuste** : Gestion des erreurs, retries automatiques et protection contre les timeouts.

## 🛠️ Stack Technique

*   **Backend** : Go (Golang) 1.22+
*   **Frontend** : HTML5, Tailwind CSS, FontAwesome
*   **IA** : OpenAI API (GPT-3.5 Turbo / GPT-4)
*   **Déploiement** : Support natif pour Docker, Render et Vercel

## 🚀 Installation Locale

### Prérequis

*   [Go](https://golang.org/doc/install) installé sur votre machine.
*   Une clé API [OpenAI](https://platform.openai.com/api-keys).

### Étapes

1.  **Cloner le dépôt** :
    ```bash
    git clone https://github.com/votre-username/Pitch-IA.git
    cd Pitch-IA
    ```

2.  **Configurer l'environnement** :
    Créez un fichier `.env` à la racine du projet :
    ```env
    OPENAI_API_KEY=votre_cle_sk_...
    PORT=8088
    ```

3.  **Installer les dépendances** :
    ```bash
    go mod download
    ```

4.  **Lancer l'application** :
    ```bash
    go run main.go
    ```
    L'application sera accessible sur `http://localhost:8088`.

## 📦 Structure du Projet

```text
.
├── main.go           # Point d'entrée de l'application
├── controllers/      # Logique de traitement des requêtes
├── models/           # Définition des structures de données
├── routes/           # Définition des points d'accès HTTP
├── service/          # Intégration OpenAI et logique métier
├── views/            # Templates HTML (Frontend)
├── Dockerfile        # Configuration pour la conteneurisation
├── render.yaml       # Configuration pour le déploiement sur Render
└── vercel.json       # Configuration pour le déploiement sur Vercel
```

## 🌐 Déploiement

### Render
Le projet inclut un fichier `render.yaml`. Liez simplement votre dépôt GitHub à Render et il détectera automatiquement la configuration. **N'oubliez pas d'ajouter la variable d'environnement `OPENAI_API_KEY`**.

### Docker
```bash
docker build -t pitch-ia .
docker run -p 8088:8088 -e OPENAI_API_KEY=votre_cle pitch-ia
```

## 📄 Licence

Distribué sous la licence MIT. Voir `LICENSE` pour plus d'informations.

---
⭐ Si ce projet vous aide, n'hésitez pas à lui donner une étoile sur GitHub !
