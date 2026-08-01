import type { BodyWeight, ISODate } from '../types'
import { daysBetween } from './dates'

export interface TrendPoint {
  date: ISODate
  kg: number
  avgKg: number
}

function byDate(entries: BodyWeight[]): BodyWeight[] {
  return entries.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/**
 * Each entry paired with the mean of all entries in the trailing `windowDays`
 * (inclusive). The average is the signal; individual readings are water weight.
 */
export function rollingAverage(entries: BodyWeight[], windowDays: number): TrendPoint[] {
  const sorted = byDate(entries)
  return sorted.map((entry) => {
    const window = sorted.filter((e) => {
      const gap = daysBetween(e.date, entry.date)
      return gap >= 0 && gap < windowDays
    })
    const avgKg = window.reduce((sum, e) => sum + e.kg, 0) / window.length
    return { date: entry.date, kg: entry.kg, avgKg }
  })
}

/** Change between the latest reading and the newest reading at least `overDays` old. */
export function weightChange(
  entries: BodyWeight[],
  overDays: number,
  today: ISODate,
): number | null {
  const sorted = byDate(entries)
  const latest = sorted[sorted.length - 1]
  if (!latest) return null
  const older = sorted.filter((e) => daysBetween(e.date, today) >= overDays).pop()
  return older ? latest.kg - older.kg : null
}
