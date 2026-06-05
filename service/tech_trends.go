package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
)

func techTrendsOnlineEnabled() bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv("TECH_TRENDS_OFFLINE")))
	if v == "1" || v == "true" || v == "yes" {
		return false
	}
	return true // défaut : tenter HN si internet sortant disponible (EC2, Docker, etc.)
}

const techTrendsCacheTTL = 45 * time.Minute

var (
	techTrendsCache     string
	techTrendsCacheTime time.Time
	techTrendsMu        sync.Mutex
)

var staticTechTrends = []string{
	"IA générative et agents pour automatiser support client et opérations (coûts PME)",
	"Super-apps et paiements intégrés (Mobile Money, wallets) en Afrique de l'Ouest",
	"API-first et embedded finance (crédit, assurance, paiement dans des apps métier)",
	"Offline-first, USSD et WhatsApp Business comme canaux à faible bande passante",
	"Open banking et agrégation de données (progression régionale, partenariats banques/telco)",
	"IoT léger et telematics pour logistique, agriculture et assurance paramétrique",
	"Marketplace B2B et digitalisation des chaînes de valeur (agro, distribution)",
}

type hnSearchResponse struct {
	Hits []struct {
		Title string `json:"title"`
		URL   string `json:"url"`
	} `json:"hits"`
}

func fetchHNTrends(query string, limit int) []string {
	client := &http.Client{Timeout: 4 * time.Second}
	apiURL := fmt.Sprintf(
		"https://hn.algolia.com/api/v1/search?query=%s&tags=story&hitsPerPage=%d",
		url.QueryEscape(query),
		limit,
	)
	resp, err := client.Get(apiURL)
	if err != nil || resp.StatusCode != http.StatusOK {
		return nil
	}
	defer resp.Body.Close()

	var data hnSearchResponse
	if json.NewDecoder(resp.Body).Decode(&data) != nil {
		return nil
	}
	out := make([]string, 0, len(data.Hits))
	for _, h := range data.Hits {
		title := strings.TrimSpace(h.Title)
		if title != "" {
			out = append(out, title)
		}
	}
	return out
}

// FetchTechTrendsBrief retourne une veille tech (cache + HN) pour enrichir les insights consultant.
func FetchTechTrendsBrief() string {
	techTrendsMu.Lock()
	if techTrendsCache != "" && time.Since(techTrendsCacheTime) < techTrendsCacheTTL {
		cached := techTrendsCache
		techTrendsMu.Unlock()
		return cached
	}
	techTrendsMu.Unlock()

	lines := make([]string, 0, 12)
	seen := map[string]bool{}

	add := func(s string) {
		s = strings.TrimSpace(s)
		if s == "" || seen[s] {
			return
		}
		seen[s] = true
		lines = append(lines, "- "+s)
	}

	for _, t := range staticTechTrends {
		add(t)
	}

	// Veille live (HN) : nécessite HTTPS sortant (hn.algolia.com). Désactiver : TECH_TRENDS_OFFLINE=true
	if techTrendsOnlineEnabled() {
		for _, q := range []string{"startup africa", "fintech mobile money", "AI SaaS"} {
			for _, title := range fetchHNTrends(q, 3) {
				add(title)
				if len(lines) >= 10 {
					break
				}
			}
		}
	}

	brief := strings.Join(lines, "\n")
	if brief == "" {
		brief = "- Mobile-first et IA appliquée aux PME en Afrique de l'Ouest"
	}

	techTrendsMu.Lock()
	techTrendsCache = brief
	techTrendsCacheTime = time.Now()
	techTrendsMu.Unlock()

	return brief
}
