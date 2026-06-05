import type { AnalyzePitchResponse, ApiError, PitchFormData } from '../types/pitch'

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const REQUEST_TIMEOUT_MS = 35_000

export async function analyzePitch(data: PitchFormData): Promise<AnalyzePitchResponse> {
  if (!API_BASE && import.meta.env.PROD) {
    throw new Error(
      'API non configurée : ajoutez VITE_API_URL sur Vercel (URL publique EC2, ex. https://api.votredomaine.com ou http://IP:8088) puis redéployez.',
    )
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(`${API_BASE}/api/analyze-pitch`, {
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
          : `Erreur ${res.status}: ${res.statusText || 'réponse non JSON'}`,
      )
    }

    if (!res.ok) {
      const message =
        payload && typeof payload === 'object' && 'error' in payload
          ? String((payload as ApiError).error)
          : `Erreur ${res.status}: ${res.statusText || 'une erreur est survenue'}`
      throw new Error(message || 'Une erreur est survenue.')
    }

    return payload as AnalyzePitchResponse
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('La requête a expiré. Réessayez dans quelques instants.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}
