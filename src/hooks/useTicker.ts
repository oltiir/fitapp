import { useEffect, useState } from 'react'

/**
 * Forces a re-render every `ms` while `enabled`. Used only to refresh the rest
 * bar's display — the remaining time itself is always recomputed from the
 * stored timestamp, so a missed tick can never desynchronise the timer.
 */
export function useTicker(ms: number, enabled: boolean): number {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => setTick((t) => t + 1), ms)
    return () => clearInterval(id)
  }, [ms, enabled])
  return tick
}
