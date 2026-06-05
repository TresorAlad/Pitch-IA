export type CountryCode = 'ci' | 'sn' | 'ml' | 'bf' | 'ne' | 'tg' | 'bj' | 'gw' | 'uemoa'

export type Audience = 'investisseur' | 'client' | 'partenaire' | 'incubateur'

export interface PitchFormData {
  country: CountryCode
  sector: string
  audience: Audience
  description: string
}

export interface PredictionFactor {
  label: string
  impact: string
  source?: 'shap' | 'spacy' | 'beautifulsoup'
}

export interface ConsultantInsights {
  tendancesIT?: string
  kpis90j?: string
  risques?: string
  prochainesEtapes?: string
}

export interface AnalyzePitchResponse {
  probleme: string
  solution: string
  marche: string
  valeur: string
  canaux: string
  modele: string
  contextLabel: string
  userInput: string
  successScore?: number
  confidence?: string
  factors?: PredictionFactor[]
  consultantInsights?: ConsultantInsights
}

export interface ApiError {
  error: string
}
