import type { Session, SessionEntry, SetEntry } from '../types'

export function emptySet(): SetEntry {
  return { weightKg: 0, reps: 0, done: false }
}

/** Epley estimated 1RM. Comparable across rep ranges, which is what makes PRs meaningful. */
export function e1rm(weightKg: number, reps: number): number {
  if (reps < 1) throw new Error(`e1rm requires reps >= 1, got ${reps}`)
  return weightKg * (1 + reps / 30)
}

export function entryFor(session: Session, exerciseId: string): SessionEntry | undefined {
  return session.entries.find((e) => e.exerciseId === exerciseId)
}

export function sessionVolume(session: Session): number {
  let total = 0
  for (const entry of session.entries) {
    for (const s of entry.sets) {
      if (s.done) total += s.weightKg * s.reps
    }
  }
  return total
}

/** Heaviest done set for one exercise in one session. This is what the exercise chart plots. */
export function topSetKg(session: Session, exerciseId: string): number | null {
  const done = entryFor(session, exerciseId)?.sets.filter((s) => s.done) ?? []
  if (done.length === 0) return null
  return Math.max(...done.map((s) => s.weightKg))
}

/**
 * Last time's sets, ready to be worked through again. Deliberately does NOT
 * increment: the app shows what happened and the lifter decides the jump.
 */
export function prefillSets(sets: SetEntry[]): SetEntry[] {
  if (sets.length === 0) return [emptySet()]
  return sets.map((s) => ({ weightKg: s.weightKg, reps: s.reps, done: false }))
}
