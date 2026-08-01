import type { Run, SetEntry, Settings } from '../types'

export const KG_PER_LB = 0.45359237

export function toDisplayWeight(kg: number, unit: Settings['unit']): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB
}

export function fromDisplayWeight(value: number, unit: Settings['unit']): number {
  return unit === 'kg' ? value : value * KG_PER_LB
}

export function formatWeight(kg: number, unit: Settings['unit']): string {
  const value = toDisplayWeight(kg, unit)
  const rounded = Math.round(value * 10) / 10
  return `${rounded}`.replace(/\.0$/, '') + ` ${unit}`
}

function displayNumber(kg: number, unit: Settings['unit']): string {
  const rounded = Math.round(toDisplayWeight(kg, unit) * 10) / 10
  return `${rounded}`
}

/**
 * How a set list reads at a glance: `80 × 8,8,7` when the weight held, or
 * `80×8, 85×5` when it changed. The collapsed form is the common case and the
 * one worth optimising, since straight sets are what the app is built around.
 */
export function formatSetSummary(sets: SetEntry[], unit: Settings['unit']): string {
  const first = sets[0]
  if (!first) return '—'
  const sameWeight = sets.every((s) => s.weightKg === first.weightKg)
  if (sameWeight) {
    return `${displayNumber(first.weightKg, unit)} × ${sets.map((s) => s.reps).join(',')}`
  }
  return sets.map((s) => `${displayNumber(s.weightKg, unit)}×${s.reps}`).join(', ')
}

export function paceSecPerKm(run: Run): number | null {
  if (run.distanceKm <= 0) return null
  return Math.round(run.durationSec / run.distanceKm)
}

export function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.round(sec % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
