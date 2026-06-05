import type { LucideIcon } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  icon?: LucideIcon
  iconClass?: string
  description?: string
}
