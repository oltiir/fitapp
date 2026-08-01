import { SPLITS, type GymVisit, type ISODate, type Session, type Split } from '../types'
import { daysBetween, todayISO, weekBounds } from './dates'
import { finishedSessions } from './history'

export const STALE_SPLIT_DAYS = 7

/** Advances the rotation from the last finished session. Follows reality; never scolds. */
export function nextSplit(sessions: Session[]): Split {
  const last = finishedSessions(sessions)[0]
  if (!last) return 'push'
  const i = SPLITS.indexOf(last.split)
  return SPLITS[(i + 1) % SPLITS.length]!
}

/** A day is attended if a session was finished on it, or it was marked manually. */
export function attendedDates(sessions: Session[], visits: GymVisit[]): Set<ISODate> {
  const dates = new Set<ISODate>()
  for (const s of finishedSessions(sessions)) dates.add(s.date)
  for (const v of visits) dates.add(v.date)
  return dates
}

export function attendedToday(sessions: Session[], visits: GymVisit[], now: Date): boolean {
  return attendedDates(sessions, visits).has(todayISO(now))
}

export interface WeekAttendance {
  dates: ISODate[]
  count: number
  splitsByDate: Record<ISODate, Split[]>
}

export function weekAttendance(
  sessions: Session[],
  visits: GymVisit[],
  now: Date,
): WeekAttendance {
  const { start, end } = weekBounds(now)
  const inWeek = (d: ISODate) => d >= start && d <= end

  const dates = [...attendedDates(sessions, visits)].filter(inWeek).sort()

  // Sorted ascending directly rather than by reversing finishedSessions: two
  // sessions logged on the same date can share a startedAt, and a stable sort
  // leaves those in input order, which reversal would then flip.
  const chronological = sessions
    .filter((s) => s.finishedAt !== null && inWeek(s.date))
    .slice()
    .sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : a.startedAt.localeCompare(b.startedAt),
    )

  const splitsByDate: Record<ISODate, Split[]> = {}
  for (const s of chronological) {
    ;(splitsByDate[s.date] ??= []).push(s.split)
  }

  return { dates, count: dates.length, splitsByDate }
}

export function daysSince(sessions: Session[], split: Split, today: ISODate): number | null {
  const last = finishedSessions(sessions).find((s) => s.split === split)
  return last ? daysBetween(last.date, today) : null
}

export function daysSinceAll(sessions: Session[], today: ISODate): Record<Split, number | null> {
  return {
    push: daysSince(sessions, 'push', today),
    pull: daysSince(sessions, 'pull', today),
    legs: daysSince(sessions, 'legs', today),
  }
}
