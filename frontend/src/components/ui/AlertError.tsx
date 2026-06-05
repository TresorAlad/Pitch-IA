import { AlertCircle } from 'lucide-react'

interface AlertErrorProps {
  message: string
}

export function AlertError({ message }: AlertErrorProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="mb-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
      <p className="leading-relaxed">{message}</p>
    </div>
  )
}
