# Pitch-IA - One-pager incubateurs & partenaires (UEMOA)

## En une phrase

**Pitch-IA** aide les fondateurs d’Afrique de l’Ouest à structurer leur idée en **brouillon de pitch en ~30 secondes**, avant le business plan ou le pitch deck investisseur.

---

## Problème adressé

- Beaucoup de porteurs de projet arrivent en incubation avec une **idée floue** ou un discours non structuré.
- Les outils existants (pitch deck IA, business plan) sont **lourds, payants** ou **non contextualisés UEMOA**.
- Les ateliers « pitch » perdent du temps sur la **mise en forme** au lieu de la **validation**.

## Solution

Application web légère (mobile-first) :

1. Le fondateur choisit **pays UEMOA**, **secteur** et **public** (investisseur, client, partenaire, jury).
2. Il décrit son projet (10-2000 caractères).
3. L’IA produit **6 blocs** : Problème, Solution, Marché, Valeur, Canaux, Modèle économique - adaptés au contexte ouest-africain (FCFA, Mobile Money, réalités locales).
4. Export par **copie** (WhatsApp, email, travail en groupe).

## Positionnement (vs concurrence)

| | Pitch-IA | IdeeLab | PitchBob / PitchCraft |
|---|----------|---------|------------------------|
| Cible | Brouillon rapide, atelier | Dossier complet UEMOA | Package investisseur global |
| Prix | Gratuit / freemium envisagé | Payant par pack | 30-100 $+ |
| Format | 6 sections texte | BP + deck 12 slides | PPTX + BP |
| Contexte AO | Oui (prompt UEMOA) | Oui (expert + données) | Non |

**Pitch-IA ne remplace pas** un pitch deck ou un accompagnement expert : c’est **l’étape 0** avant IdeeLab, un mentor ou une levée.

## Bénéfices pour votre programme

- **Atelier pitch** : 20 fondateurs structurent leur idée en 15 minutes.
- **Pré-sélection** : homogénéiser les candidatures avant jury.
- **Mobile / faible bande passante** : une page, pas de téléchargement lourd.
- **Francophone UEMOA** : 8 pays, secteurs tech locaux (AgriTech, FinTech, etc.).

## Déploiement technique

- Stack : React + Vite, Go, Groq (Mixtral), Python ML, Docker (EC2) / Vercel.
- Variables : `GROQ_API_KEY`, `GROQ_MODEL` (défaut `llama-3.3-70b-versatile`), `ML_SERVICE_URL` (score LightGBM). L’utilisateur envoie son idée ; l’API combine IA + ML sans choix technique.
- Health check : `GET /health`.

## Proposition de partenariat (exemple)

| Offre | Contenu |
|-------|---------|
| **Atelier** | Session 2h : Pitch-IA + relecture mentor |
| **Licence programme** | URL dédiée + logo incubateur (white-label v2) |
| **Hackathon** | QR code vers Pitch-IA pour phase idéation |

## Indicateurs de succès (pilote 3 mois)

- Nombre de pitchs générés
- Taux de complétion (soumission → résultat)
- NPS fondateurs post-atelier
- % passant à l’étape « deck / BP » avec un partenaire

## Contact & démo

- Dépôt : repository Pitch-IA
- Démo live : instance hébergée (EC2 / Docker)
- Contact fondateur : *[à compléter : email, téléphone, LinkedIn]*

---

*Document prêt pour CTIC Dakar, Orange Startup Studio, Fabrique, concours étudiants, programmes BCEAO / innovation.*
