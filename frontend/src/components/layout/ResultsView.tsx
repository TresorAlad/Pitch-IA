import { useState } from 'react'
import {
  Check,
  CheckCircle2,
  Copy,
  RotateCcw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { AnalyzePitchResponse, PitchFormData } from '../../types/pitch'
import { PITCH_SECTIONS } from '../../constants/form-options'
import { buildContextChips, buildContextLabel } from '../../utils/context-label'
import { CardPitchSection } from '../CardPitchSection'
import { ConsultantInsightsCard } from '../ConsultantInsightsCard'

interface ResultsViewProps {
  data: AnalyzePitchResponse
  form: PitchFormData
  onReset: () => void
}

interface ScoreMeta {
  label: string
  tier: 'high' | 'mid' | 'low'
  stroke: string
  color: string
  bg: string
}

function getScoreMeta(score: number): ScoreMeta {
  if (score >= 70) {
    return {
      label: 'Bon potentiel',
      tier: 'high',
      stroke: '#15803d',
      color: '#15803d',
      bg: '#f0fdf4',
    }
  }
  if (score >= 45) {
    return {
      label: 'Potentiel modéré',
      tier: 'mid',
      stroke: '#d97706',
      color: '#b45309',
      bg: '#fffbeb',
    }
  }
  return {
    label: 'À renforcer',
    tier: 'low',
    stroke: '#dc2626',
    color: '#b91c1c',
    bg: '#fef2f2',
  }
}

function confidenceLabel(confidence?: string): string | null {
  switch (confidence) {
    case 'high':
      return 'Confiance élevée'
    case 'medium':
      return 'Confiance modérée'
    case 'low':
      return 'Confiance limitée'
    default:
      return null
  }
}

function isPositiveImpact(impact: string): boolean {
  const trimmed = impact.trim()
  if (trimmed.startsWith('-')) return false
  if (trimmed.startsWith('+')) return true
  const n = parseFloat(trimmed)
  return !Number.isNaN(n) && n >= 0
}

function ScoreGauge({ score }: { score: number }) {
  const meta = getScoreMeta(score)
  const r = 58
  const circ = 2 * Math.PI * r
  const arcLen = circ * 0.75
  const filled = arcLen * (score / 100)

  return (
    <div className={`score-gauge score-gauge--${meta.tier}`}>
      <div
        className="score-gauge__ring"
        role="img"
        aria-label={`Score de viabilité : ${score} sur 100, ${meta.label}`}
      >
        <svg width="156" height="156" viewBox="0 0 156 156" className="score-gauge__svg">
          <circle
            cx="78"
            cy="78"
            r={r}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${arcLen} ${circ}`}
            transform="rotate(135 78 78)"
          />
          <circle
            cx="78"
            cy="78"
            r={r}
            fill="none"
            stroke={meta.stroke}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circ}`}
            transform="rotate(135 78 78)"
            className="score-gauge__arc"
          />
        </svg>
        <div className="score-gauge__value">
          <span className="score-gauge__number">{score}</span>
          <span className="score-gauge__max">/ 100</span>
        </div>
      </div>
      <span
        className="score-gauge__badge"
        style={{ color: meta.color, background: meta.bg, borderColor: `${meta.color}33` }}
      >
        {meta.label}
      </span>
    </div>
  )
}

export function ResultsView({ data, form, onReset }: ResultsViewProps) {
  const [copiedAll, setCopiedAll] = useState(false)
  const score = data.successScore
  const contextParts = buildContextChips(form)
  const contextLabel = buildContextLabel(form) || data.contextLabel
  const confLabel = confidenceLabel(data.confidence)

  async function handleCopyAll() {
    const lines = ['PITCH-IA — Brouillon de pitch', '']
    if (contextLabel) lines.push(`Contexte : ${contextLabel}`, '')
    PITCH_SECTIONS.forEach((s) => lines.push(`${s.title}\n${data[s.key]}`, ''))
    const ins = data.consultantInsights
    if (ins) {
      lines.push('--- Insights consultant ---', '')
      if (ins.tendancesIT) lines.push(`Tendances IT\n${ins.tendancesIT}`, '')
      if (ins.kpis90j) lines.push(`KPIs 90j\n${ins.kpis90j}`, '')
      if (ins.risques) lines.push(`Risques\n${ins.risques}`, '')
      if (ins.prochainesEtapes) lines.push(`Prochaines étapes\n${ins.prochainesEtapes}`, '')
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n').trim())
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    } catch {
      /* permission refusée */
    }
  }

  return (
    <div className="results-page">
      <header className="results-hero">
        <div className="results-hero__main">
          <div className="results-hero__status">
            <CheckCircle2 size={14} aria-hidden />
            Analyse terminée
          </div>
          <h1 className="results-hero__title">Votre brouillon de pitch</h1>
          {contextParts.length > 0 && (
            <div className="results-hero__chips" role="list">
              {contextParts.map((part) => (
                <span key={part} className="results-chip" role="listitem">
                  {part}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="results-hero__actions">
          <button
            type="button"
            onClick={handleCopyAll}
            className={`btn btn-subtle results-hero__btn${copiedAll ? ' results-hero__btn--success' : ''}`}
          >
            {copiedAll ? (
              <>
                <Check size={14} aria-hidden />
                Copié
              </>
            ) : (
              <>
                <Copy size={14} aria-hidden />
                Copier tout
              </>
            )}
          </button>
          <button type="button" onClick={onReset} className="btn btn-red results-hero__btn">
            <RotateCcw size={14} aria-hidden />
            Nouveau pitch
          </button>
        </div>
      </header>

      {data.userInput && (
        <blockquote className="results-quote">
          <span className="results-quote__label">Votre idée</span>
          <p>« {data.userInput} »</p>
        </blockquote>
      )}

      <div className="results-layout">
        {typeof score === 'number' && (
          <aside className="results-sidebar">
            <div className="card results-score-card">
              <p className="results-card__eyebrow">Score de viabilité</p>
              <ScoreGauge score={score} />
              {confLabel && (
                <p className="results-score-card__confidence">{confLabel}</p>
              )}
              <p className="results-score-card__footnote">
                Évaluation ML · données marché UEMOA
              </p>
            </div>

            {data.factors && data.factors.length > 0 && (
              <div className="card results-factors-card">
                <p className="results-card__eyebrow results-factors-card__head">
                  Facteurs clés
                </p>
                <ul className="results-factors">
                  {data.factors.map((f) => {
                    const pos = isPositiveImpact(f.impact)
                    return (
                      <li key={`${f.label}-${f.impact}`} className="results-factors__item">
                        <span
                          className={`results-factors__icon${pos ? ' results-factors__icon--up' : ' results-factors__icon--down'}`}
                          aria-hidden
                        >
                          {pos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        </span>
                        <div className="results-factors__body">
                          <span
                            className={`results-factors__impact${pos ? ' results-factors__impact--up' : ' results-factors__impact--down'}`}
                          >
                            {f.impact}
                          </span>
                          <span className="results-factors__label">{f.label}</span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </aside>
        )}

        <div className="results-pitch">
          <div className="card results-pitch-card">
            <div className="results-pitch-card__header">
              <div>
                <p className="results-card__eyebrow">Structure du pitch</p>
                <p className="results-pitch-card__sub">6 sections prêtes à partager</p>
              </div>
              <span className="results-pitch-card__count">6/6</span>
            </div>
            <div className="results-pitch-card__sections">
              {PITCH_SECTIONS.map((section, i) => (
                <CardPitchSection
                  key={section.key}
                  index={i + 1}
                  title={section.title}
                  content={data[section.key]}
                  last={i === PITCH_SECTIONS.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {data.consultantInsights && (
        <ConsultantInsightsCard insights={data.consultantInsights} />
      )}
    </div>
  )
}
