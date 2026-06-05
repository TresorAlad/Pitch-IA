import { ArrowRight, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { PitchFormData } from '../../types/pitch'
import { AUDIENCE_OPTIONS, COUNTRY_OPTIONS, SECTOR_OPTIONS } from '../../constants/form-options'
import { buildContextChips } from '../../utils/context-label'
import { DescriptionField } from '../DescriptionField'
import { SelectField } from '../SelectField'
import { HeroPanel } from './HeroPanel'

interface LandingViewProps {
  isLoading: boolean
  onSubmit: (data: PitchFormData) => void
}

const DEFAULT_FORM: PitchFormData = {
  country: 'tg',
  sector: 'FinTech',
  audience: 'investisseur',
  description: '',
}

export function LandingView({ isLoading, onSubmit }: LandingViewProps) {
  const [form, setForm] = useState<PitchFormData>(DEFAULT_FORM)
  const selectionChips = buildContextChips(form)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="landing-wrap">
      <HeroPanel />

      <section className="landing-form">
        {isLoading && (
          <div className="landing-form__overlay">
            <Loader2 size={28} className="landing-form__spinner" />
            <p className="landing-form__overlay-title">Analyse en cours…</p>
            <p className="landing-form__overlay-sub">Votre pitch et l&apos;analyse arrivent dans ~30 s</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="landing-form__inner">
          <header className="landing-form__head">
            <h2 className="landing-form__title">Exprimez votre idée</h2>
            <p className="landing-form__subtitle">
              Remplissez le formulaire, envoyez - vous obtenez un pitch structuré et une évaluation.
            </p>
          </header>

          <div className="selects-grid selects-grid--three">
            <SelectField
              id="country"
              label="Pays / zone"
              value={form.country}
              options={COUNTRY_OPTIONS}
              onChange={(v) => setForm({ ...form, country: v as PitchFormData['country'] })}
              disabled={isLoading}
            />
            <SelectField
              id="sector"
              label="Secteur"
              value={form.sector}
              options={SECTOR_OPTIONS}
              onChange={(v) => setForm({ ...form, sector: v })}
              disabled={isLoading}
            />
            <SelectField
              id="audience"
              label="À qui s'adresse le pitch ?"
              value={form.audience}
              options={AUDIENCE_OPTIONS}
              onChange={(v) => setForm({ ...form, audience: v as PitchFormData['audience'] })}
              disabled={isLoading}
            />
          </div>

          {selectionChips.length > 0 && (
            <div className="form-selection-chips" role="list" aria-label="Options sélectionnées">
              {selectionChips.map((chip) => (
                <span key={chip} className="form-selection-chip" role="listitem">
                  {chip}
                </span>
              ))}
            </div>
          )}

          <DescriptionField
            value={form.description}
            onChange={(description) => setForm({ ...form, description })}
            disabled={isLoading}
          />

          <footer className="landing-form__actions">
            <button type="submit" disabled={isLoading} className="btn btn-red landing-form__submit">
              {isLoading ? (
                <>
                  <Loader2 size={17} className="landing-form__spinner" />
                  Analyse…
                </>
              ) : (
                <>
                  Obtenir mon pitch
                  <ArrowRight size={16} />
                </>
              )}
            </button>
            <p className="landing-form__hint">Réponse en ~30 s · Aucun compte requis</p>
          </footer>
        </form>
      </section>
    </div>
  )
}
