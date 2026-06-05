import type { AnalyzePitchResponse, ApiError, PitchFormData } from '../types/pitch'

// Vide en prod = même origine (proxy Vercel → EC2, voir frontend/vercel.json)
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const REQUEST_TIMEOUT_MS = 35_000

export async function analyzePitch(data: PitchFormData): Promise<AnalyzePitchResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const url = `${API_BASE}/api/analyze-pitch`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    })

    let payload: unknown
    try {
      payload = await res.json()
    } catch {
      throw new Error(
        res.ok
          ? 'Réponse serveur invalide.'
          : `Erreur ${res.status} sur ${url} : réponse non JSON`,
      )
    }

    if (!res.ok) {
      const apiMsg =
        payload && typeof payload === 'object' && 'error' in payload
          ? String((payload as ApiError).error)
          : ''
      const message =
        apiMsg ||
        `Erreur ${res.status} sur ${url}${res.statusText ? ` (${res.statusText})` : ''}`
      throw new Error(message)
    }

    return payload as AnalyzePitchResponse
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('La requête a expiré. Réessayez dans quelques instants.')
    }
    if (err instanceof TypeError) {
      throw new Error(
        'Impossible de joindre l\'API. Si VITE_API_URL pointe vers http://IP:8088, le navigateur bloque (HTTPS→HTTP). Supprimez VITE_API_URL sur Vercel et utilisez le proxy (vercel.json), ou passez l\'API en HTTPS.',
      )
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}
