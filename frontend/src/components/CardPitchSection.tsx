import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface CardPitchSectionProps {
  index: number
  title: string
  content: string
  last?: boolean
}

export function CardPitchSection({ index, title, content, last = false }: CardPitchSectionProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${title}\n${content}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* permission refusée ou API indisponible */
    }
  }

  return (
    <article className={`pitch-section${last ? ' pitch-section--last' : ''}`}>
      <div className="pitch-section__head">
        <div className="pitch-section__title-row">
          <span className="pitch-section__index" aria-hidden="true">
            {index}
          </span>
          <h3 className="pitch-section__title">{title}</h3>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={`pitch-section__copy${copied ? ' pitch-section__copy--done' : ''}`}
          aria-label={copied ? `${title} copié` : `Copier ${title}`}
        >
          {copied ? (
            <>
              <Check size={13} strokeWidth={2.5} aria-hidden />
              Copié
            </>
          ) : (
            <>
              <Copy size={13} aria-hidden />
              Copier
            </>
          )}
        </button>
      </div>
      <p className="pitch-section__body">{content}</p>
    </article>
  )
}
