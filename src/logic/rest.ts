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
