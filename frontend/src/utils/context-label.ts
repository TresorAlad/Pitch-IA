import type { PitchFormData } from '../types/pitch'
import { AUDIENCE_OPTIONS, COUNTRY_OPTIONS, SECTOR_OPTIONS } from '../constants/form-options'

function labelFor(
  options: { value: string; label: string }[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value
}

/** Libellés affichés pour les puces contexte (pays, secteur, audience). */
export function buildContextChips(form: PitchFormData): string[] {
  const chips = [
    labelFor(COUNTRY_OPTIONS, form.country),
    labelFor(SECTOR_OPTIONS, form.sector),
    labelFor(AUDIENCE_OPTIONS, form.audience),
  ].filter(Boolean)
  return chips
}

export function buildContextLabel(form: PitchFormData): string {
  return buildContextChips(form).join(' · ')
}

/** Parse contextLabel API (séparateurs · • |). */
export function parseContextLabel(label: string): string[] {
  return label
    .split(/\s*[·•|]\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
}
