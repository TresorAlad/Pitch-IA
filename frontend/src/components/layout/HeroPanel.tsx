import { FileText, LineChart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const FEATURES: { icon: LucideIcon; title: string; sub: string }[] = [
  { icon: FileText, title: '6 sections', sub: 'Structure investisseur' },
  { icon: LineChart, title: 'Score viabilité', sub: 'Analyse instantanée' },
]

export function HeroPanel() {
  return (
    <aside className="hero-panel">
      <div className="hero-panel__glow" aria-hidden />

      <div className="hero-panel__content">
        <p className="hero-panel__eyebrow">Pour les fondateurs</p>
        <h1 className="hero-panel__title">
          Votre pitch professionnel, prêt en 30&nbsp;s
        </h1>
        <p className="hero-panel__lead">
          Structurez votre discours et obtenez une évaluation de viabilité.
        </p>
      </div>

      <ul className="hero-panel__features">
        {FEATURES.map(({ icon: Icon, title, sub }) => (
          <li key={title} className="hero-panel__feature">
            <span className="hero-panel__feature-icon" aria-hidden>
              <Icon size={16} strokeWidth={2} />
            </span>
            <div className="hero-panel__feature-text">
              <span className="hero-panel__feature-title">{title}</span>
              <span className="hero-panel__feature-sub">{sub}</span>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}
