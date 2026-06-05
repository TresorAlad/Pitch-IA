package service

import (
	"fmt"
	"pitch/models"
	"strings"
)

const pitchFormatRules = `Tu dois répondre avec EXACTEMENT 6 lignes (une section par ligne), format strict :

1. [Problème] ...
2. [Solution] ...
3. [Marché] ...
4. [Valeur] ...
5. [Canaux] ...
6. [Modèle] ...

Pas de texte avant la ligne 1. Pas de texte après la ligne 6.`

func buildSystemPrompt() string {
	return `Tu es un expert en structuration de pitchs pour entrepreneurs en Afrique de l'Ouest (zone UEMOA).
Tu connais : Mobile Money (Orange Money, Wave, MTN MoMo), FCFA, PME informelles, mobile-first, OHADA, BCEAO.

RÈGLE ABSOLUE : le pitch décrit EXACTEMENT le projet dans « Description du projet ».
Le secteur et la cible sont indicatifs ; la description fait foi.

` + pitchFormatRules
}

func audienceGuidance(audience string) string {
	switch strings.ToLower(strings.TrimSpace(audience)) {
	case "investisseur":
		return "Public : investisseurs / BA / fonds — insister sur TAM, scalabilité, unit economics, ticket FCFA, risques et sortie."
	case "client":
		return "Public : clients finaux ou PME — bénéfices concrets, prix FCFA, adoption simple, preuve de valeur en 30 jours."
	case "partenaire":
		return "Public : partenaires B2B (telco, banque, distributeur) — win-win, intégration API, co-branding, déploiement géographique."
	case "incubateur":
		return "Public : incubateur / jury / concours — clarté problème-solution, impact local, faisabilité MVP, équipe et roadmap 90j."
	default:
		return "Public : entrepreneur en phase d'idéation — clarté, pragmatisme, prochaines étapes terrain."
	}
}

func buildUserPrompt(ctx models.PitchContext) string {
	country := strings.TrimSpace(ctx.Country)
	if country == "" {
		country = "UEMOA (Afrique de l'Ouest)"
	}
	sector := strings.TrimSpace(ctx.Sector)
	if sector == "" {
		sector = "non précisé"
	}
	audience := strings.TrimSpace(ctx.Audience)
	if audience == "" {
		audience = "investisseur"
	}

	return fmt.Sprintf(`Génère le pitch structuré pour CE projet (pas un autre sujet du secteur %s).

Contexte :
- Pays / zone : %s
- Secteur déclaré : %s
- Cible du pitch : %s
- Ton : %s

Description du projet (SOURCE PRINCIPALE) :
%s`,
		sector,
		country,
		sector,
		audience,
		audienceGuidance(audience),
		strings.TrimSpace(ctx.Description),
	)
}
