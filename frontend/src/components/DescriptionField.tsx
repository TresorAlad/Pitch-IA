import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'

interface DescriptionFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  maxLength?: number
}

type SpeechRecognitionCtor = new () => SpeechRecognition

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function DescriptionField({
  value,
  onChange,
  disabled = false,
  maxLength = 2000,
}: DescriptionFieldProps) {
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    setVoiceSupported(getSpeechRecognition() !== null)
    return () => recognitionRef.current?.abort()
  }, [])

  function stopListening() {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  function toggleVoice() {
    if (disabled) return
    setVoiceError('')

    if (isListening) {
      stopListening()
      return
    }

    const Ctor = getSpeechRecognition()
    if (!Ctor) {
      setVoiceError('La dictée vocale n\'est pas disponible sur ce navigateur.')
      return
    }

    const recognition = new Ctor()
    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = true

    let finalBuffer = value

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalBuffer = `${finalBuffer}${finalBuffer && !finalBuffer.endsWith(' ') ? ' ' : ''}${chunk}`.trim()
        } else {
          interim += chunk
        }
      }
      const combined = `${finalBuffer}${interim ? (finalBuffer ? ' ' : '') + interim : ''}`.slice(0, maxLength)
      onChange(combined)
    }

    recognition.onerror = () => {
      setVoiceError('Impossible d\'utiliser le micro. Vérifiez les permissions.')
      stopListening()
    }

    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  return (
    <div className="idea-field">
      <label htmlFor="description" className="field-label idea-field__label">
        Votre idée
      </label>

      <p className="idea-field__hint">
        Décrivez votre idée en quelques phrases - vous recevrez votre pitch et l&apos;analyse juste après.
      </p>

      <div className={`idea-field__box ${isListening ? 'idea-field__box--listening' : ''}`}>
        <textarea
          id="description"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          minLength={10}
          required
          disabled={disabled}
          rows={4}
          placeholder="Ex. : Une app qui connecte les commerçants de Lomé aux fournisseurs locaux, avec paiement mobile…"
          className="field-input idea-field__textarea"
        />
        {voiceSupported && (
          <button
            type="button"
            onClick={toggleVoice}
            disabled={disabled}
            className={`idea-field__mic ${isListening ? 'idea-field__mic--active' : ''}`}
            aria-pressed={isListening}
            aria-label={isListening ? 'Arrêter la dictée' : 'Dicter votre idée au micro'}
            title={isListening ? 'Arrêter' : 'Dicter au micro'}
          >
            {isListening ? <MicOff size={18} strokeWidth={2} /> : <Mic size={18} strokeWidth={2} />}
          </button>
        )}
      </div>

      <div className="idea-field__footer">
        {voiceError && <p className="idea-field__voice-error">{voiceError}</p>}
        {isListening && (
          <p className="idea-field__listening">Écoute en cours… parlez maintenant</p>
        )}
        <p className="idea-field__counter">{value.length} / {maxLength}</p>
      </div>
    </div>
  )
}
