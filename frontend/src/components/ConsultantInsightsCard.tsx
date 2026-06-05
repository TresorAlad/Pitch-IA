import { Lightbulb, ListChecks, AlertCircle, Route } from 'lucide-react'
import type { ConsultantInsights } from '../types/pitch'

interface ConsultantInsightsCardProps {
  insights: ConsultantInsights
}

const ITEMS = [
  { key: 'tendancesIT' as const, title: 'Tendances IT (UEMOA)', icon: Lightbulb },
  { key: 'kpis90j' as const, title: 'KPIs — 90 jours', icon: ListChecks },
  { key: 'risques' as const, title: 'Risques clés', icon: AlertCircle },
  { key: 'prochainesEtapes' as const, title: 'Prochaines étapes', icon: Route },
]

export function ConsultantInsightsCard({ insights }: ConsultantInsightsCardProps) {
  const visible = ITEMS.filter((item) => insights[item.key]?.trim())
  if (visible.length === 0) return null

  return (
    <section className="card consultant-insights" aria-labelledby="consultant-insights-title">
      <header className="consultant-insights__header">
        <h2 id="consultant-insights-title" className="consultant-insights__title">
          Insights consultant
        </h2>
        <p className="consultant-insights__sub">
          Conseil digital · UEMOA · veille tech (sources publiques + tendances marché) appliquée à votre idée
        </p>
      </header>
      <ul className="consultant-insights__list">
        {visible.map((item) => {
          const Icon = item.icon
          const text = insights[item.key]!
          return (
            <li key={item.key} className="consultant-insights__item">
              <div className="consultant-insights__item-head">
                <Icon size={16} aria-hidden className="consultant-insights__icon" />
                <h3 className="consultant-insights__item-title">{item.title}</h3>
              </div>
              <p className="consultant-insights__item-body">{text}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
