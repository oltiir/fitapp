import { useEffect } from 'react'

interface WakeLockSentinel {
  release(): Promise<void>
}
interface WakeLockNavigator {
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinel> }
}

/**
 * Keeps the screen awake during a workout. Re-acquired on visibilitychange
 * because iOS releases the lock whenever the app is backgrounded.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const wakeLock = (navigator as Navigator & WakeLockNavigator).wakeLock
    if (!wakeLock) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        sentinel = await wakeLock.request('screen')
        if (cancelled) void sentinel.release()
      } catch {
        // Denied or unsupported — the workout still logs fine without it.
      }
    }

    void acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', acquire)
      void sentinel?.release()
      sentinel = null
    }
  }, [active])
}
