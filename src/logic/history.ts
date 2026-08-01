import type { ISODate, Session, SetEntry } from '../types'
import { daysBetween } from './dates'
import { e1rm, entryFor } from './sets'

export interface LastPerformance {
  date: ISODate
  daysAgo: number
  sets: SetEntry[]
}

export interface PersonalRecord {
  weightKg: number
  reps: number
  date: ISODate
  e1rm: number
}

/** Finished sessions only, newest first. The active session is never history. */
export function finishedSessions(sessions: Session[]): Session[] {
  return sessions
    .filter((s) => s.finishedAt !== null)
    .slice()
    .sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : b.startedAt.localeCompare(a.startedAt),
    )
}

export function activeSession(sessions: Session[]): Session | undefined {
  return sessions.find((s) => s.finishedAt === null)
}

/**
 * The last time this exercise was actually performed — keyed on the exercise, not
 * the split, so moving an exercise between templates preserves its history.
 */
export function lastPerformance(
  sessions: Session[],
  exerciseId: string,
  today: ISODate,
): LastPerformance | null {
  for (const session of finishedSessions(sessions)) {
    const done = entryFor(session, exerciseId)?.sets.filter((s) => s.done) ?? []
    if (done.length === 0) continue
    return { date: session.date, daysAgo: daysBetween(session.date, today), sets: done }
  }
  return null
}

/** Best estimated 1RM ever recorded, reported as the real set that produced it. */
export function personalRecord(sessions: Session[], exerciseId: string): PersonalRecord | null {
  let best: PersonalRecord | null = null
  for (const session of finishedSessions(sessions)) {
    for (const s of entryFor(session, exerciseId)?.sets ?? []) {
      if (!s.done || s.reps < 1) continue
      const score = e1rm(s.weightKg, s.reps)
      const better =
        best === null || score > best.e1rm || (score === best.e1rm && s.weightKg > best.weightKg)
      if (better) best = { weightKg: s.weightKg, reps: s.reps, date: session.date, e1rm: score }
    }
  }
  return best
}
