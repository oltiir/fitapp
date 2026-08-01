import type { ISODate } from '../types'

const MS_PER_DAY = 86_400_000

export function toISODate(d: Date): ISODate {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parses as LOCAL midnight. `new Date('2026-08-01')` would parse as UTC and shift the day. */
export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}

export function todayISO(now: Date): ISODate {
  return toISODate(now)
}

/**
 * Whole local calendar days from `from` to `to`. Negative when `to` precedes `from`.
 * Both endpoints are normalised to UTC midnight before subtracting, so DST
 * transitions (a 23- or 25-hour local day) cannot skew the result.
 */
export function daysBetween(from: ISODate, to: ISODate): number {
  const a = parseISODate(from)
  const b = parseISODate(to)
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utcB - utcA) / MS_PER_DAY)
}

/** Monday-start week containing `now`. */
export function weekBounds(now: Date): { start: ISODate; end: ISODate } {
  const dow = now.getDay() // 0 = Sunday
  const backToMonday = (dow + 6) % 7
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - backToMonday)
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
  return { start: toISODate(start), end: toISODate(end) }
}

export function datesInRange(start: ISODate, end: ISODate): ISODate[] {
  const out: ISODate[] = []
  const cursor = parseISODate(start)
  const last = parseISODate(end)
  while (cursor <= last) {
    out.push(toISODate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}
