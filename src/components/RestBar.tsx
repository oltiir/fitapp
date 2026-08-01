import { useEffect, useRef } from 'react'
import type { Session } from '../types'
import { restJustFinished, restRemaining } from '../logic/rest'
import { useTicker } from '../hooks/useTicker'
import { formatDuration } from '../logic/units'

export default function RestBar({
  session,
  beepEnabled,
  onBeep,
  onExtend,
  onSkip,
  withTabs = true,
}: {
  session: Session
  beepEnabled: boolean
  onBeep: () => void
  onExtend: (seconds: number) => void
  onSkip: () => void
  withTabs?: boolean
}) {
  useTicker(250, session.restStartedAt !== null)

  const now = new Date()
  const remaining = restRemaining(session.restStartedAt, session.restSeconds, now)
  const justFinished = restJustFinished(session.restStartedAt, session.restSeconds, now)

  // One beep per rest period. The ticker fires ~8 times inside the grace window,
  // and re-mounting the bar must not replay a beep for a period already announced.
  const beepedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!justFinished || session.restStartedAt === null) return
    if (beepedFor.current === session.restStartedAt) return
    beepedFor.current = session.restStartedAt
    if (beepEnabled) onBeep()
  }, [justFinished, session.restStartedAt, beepEnabled, onBeep])

  if (remaining === null || session.restSeconds === null) return null

  const pct = Math.max(0, Math.min(100, (remaining / session.restSeconds) * 100))
  const done = remaining === 0

  return (
    <div className={`restbar${done ? ' done' : ''}${withTabs ? '' : ' no-tabs'}`}>
      <div className="spread">
        <span className="restbar-time">
          {done ? 'Rest done' : `⏱ ${formatDuration(remaining)}`}
        </span>
        <span className="row">
          <button className="btn btn-sm btn-ghost" onClick={() => onExtend(30)}>
            +30s
          </button>
          <button className="btn btn-sm btn-ghost" onClick={onSkip}>
            Skip
          </button>
        </span>
      </div>
      <div className="restbar-track">
        <div className="restbar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
