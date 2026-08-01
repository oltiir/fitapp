import type { ISOTime } from '../types'

/**
 * Seconds left on the rest timer, derived from the stored start timestamp.
 * Never decrement a counter for this: intervals freeze when iOS backgrounds
 * the app or the screen locks, so a counter comes back wrong after the phone
 * has been in a pocket. Timestamp arithmetic comes back correct.
 */
export function restRemaining(
  restStartedAt: ISOTime | null,
  restSeconds: number | null,
  now: Date,
): number | null {
  if (restStartedAt === null || restSeconds === null) return null
  const elapsedMs = now.getTime() - new Date(restStartedAt).getTime()
  return Math.max(0, Math.ceil(restSeconds - elapsedMs / 1000))
}

/**
 * True only in the brief window just after the timer hits zero.
 *
 * This is what stops a late beep: if the app was backgrounded through the end
 * of a rest period, returning to it finds the timer long expired, and beeping
 * then would be worse than staying silent. `restRemaining` clamps to 0 and so
 * cannot distinguish "just finished" from "finished four minutes ago".
 */
export function restJustFinished(
  restStartedAt: ISOTime | null,
  restSeconds: number | null,
  now: Date,
  graceSec = 2,
): boolean {
  if (restStartedAt === null || restSeconds === null) return false
  const overshootSec = (now.getTime() - new Date(restStartedAt).getTime()) / 1000 - restSeconds
  return overshootSec >= 0 && overshootSec < graceSec
}
