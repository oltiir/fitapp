import type { Run, Settings } from '../types'

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
