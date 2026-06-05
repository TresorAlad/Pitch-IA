import { useState } from 'react'
import { analyzePitch } from './api/pitch'
import type { AnalyzePitchResponse, PitchFormData } from './types/pitch'
import { AppShell } from './components/layout/AppShell'
import { LandingView } from './components/layout/LandingView'
import { ResultsView } from './components/layout/ResultsView'
import { AlertError } from './components/ui/AlertError'

function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AnalyzePitchResponse | null>(null)

  async function handleSubmit(data: PitchFormData) {
    setError('')
    setIsLoading(true)
    try {
      const response = await analyzePitch(data)
      setResult(response)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (result) {
    return (
      <AppShell>
        <AlertError message={error} />
        <ResultsView data={result} onReset={handleReset} />
      </AppShell>
    )
  }

  return (
    <AppShell fullBleed>
      <LandingView isLoading={isLoading} onSubmit={handleSubmit} />
      {error && <div className="landing-error"><AlertError message={error} /></div>}
    </AppShell>
  )
}

export default App
