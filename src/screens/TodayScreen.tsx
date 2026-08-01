import { useStore } from '../store/StoreContext'
import { unlockAudio } from '../lib/audio'
import { newId } from '../logic/id'
import { todayISO } from '../logic/dates'
import { activeSession, lastPerformance } from '../logic/history'
import { nextSplit } from '../logic/attendance'
import { emptySet, prefillSets } from '../logic/sets'
import { SPLITS, SPLIT_LABEL, type Session, type Split } from '../types'

export default function TodayScreen({
  onOpenSession,
}: {
  onOpenSession: (sessionId: string) => void
}) {
  const { data, beginSession } = useStore()

  const now = new Date()
  const today = todayISO(now)
  const active = activeSession(data.sessions)
  const suggested = nextSplit(data.sessions)

  async function startSplit(split: Split) {
    // Unlock audio on this real user gesture — iOS will not start an
    // AudioContext later, when the rest timer actually wants to beep.
    unlockAudio()

    const template = data.templates.find((t) => t.split === split)
    const entries = (template?.exerciseIds ?? []).map((exerciseId) => {
      const last = lastPerformance(data.sessions, exerciseId, today)
      return { exerciseId, sets: last ? prefillSets(last.sets) : [emptySet()] }
    })

    const session: Session = {
      id: newId(),
      split,
      date: today,
      startedAt: now.toISOString(),
      finishedAt: null,
      entries,
      restStartedAt: null,
      restSeconds: null,
    }
    await beginSession(session)
    onOpenSession(session.id)
  }

  return (
    <div className="screen">
      <h1>
        {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
      </h1>

      {active && (
        <div className="card status-card attended">
          <div className="spread">
            <div>
              <strong>In progress — {SPLIT_LABEL[active.split]}</strong>
              <div className="sub">Started {new Date(active.startedAt).toLocaleTimeString()}</div>
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => onOpenSession(active.id)}>
              Resume
            </button>
          </div>
        </div>
      )}

      {!active && (
        <div className="card">
          <div className="sub">Next up</div>
          <strong style={{ fontSize: 20 }}>{SPLIT_LABEL[suggested].toUpperCase()}</strong>
          <button
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            onClick={() => void startSplit(suggested)}
          >
            Start {SPLIT_LABEL[suggested]}
          </button>
          <div className="btn-grid" style={{ marginTop: 10 }}>
            {SPLITS.filter((s) => s !== suggested).map((s) => (
              <button key={s} className="btn" onClick={() => void startSplit(s)}>
                {SPLIT_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
