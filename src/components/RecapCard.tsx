import { useStore } from '../store/StoreContext'
import { daysBetween, parseISODate, todayISO } from '../logic/dates'
import { finishedSessions } from '../logic/history'
import { sessionVolume } from '../logic/sets'
import { formatDuration, formatSetSummary, toDisplayWeight } from '../logic/units'
import { SPLIT_LABEL, type Split } from '../types'

export default function RecapCard({ split }: { split: Split }) {
  const { data } = useStore()
  const unit = data.settings.unit
  const today = todayISO(new Date())

  const session = finishedSessions(data.sessions).find((s) => s.split === split)

  if (!session) {
    return (
      <>
        <h2 className="rule">Last {SPLIT_LABEL[split]}</h2>
        <div className="empty">No {SPLIT_LABEL[split]} session logged yet.</div>
      </>
    )
  }

  const gap = daysBetween(session.date, today)
  const nameOf = (id: string) => data.exercises.find((e) => e.id === id)?.name ?? id
  const duration = session.finishedAt
    ? formatDuration(
        (new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 1000,
      )
    : '—'
  const volume = `${Math.round(toDisplayWeight(sessionVolume(session), unit)).toLocaleString()} ${unit}`

  return (
    <>
      <h2 className="rule">
        <span>
          Last {SPLIT_LABEL[split]} —{' '}
          {parseISODate(session.date).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </span>
        {/* Parked at the end of the rule rather than on its own line under it,
            where it read as a second heading repeating the date above. */}
        <span className="val">{gap === 0 ? 'today' : `${gap} days ago`}</span>
      </h2>

      <div className="list">
        {session.entries.map((entry, i) => {
          const done = entry.sets.filter((s) => s.done)
          return (
            <div className="list-item" key={`${entry.exerciseId}-${i}`}>
              <div className="grow nm">{nameOf(entry.exerciseId)}</div>
              <div className={done.length === 0 ? 'sub' : 'val'}>
                {done.length === 0 ? 'skipped' : formatSetSummary(done, unit)}
              </div>
            </div>
          )
        })}
      </div>

      {/* A line of facts stays in the data voice here as it does on Today, so the
          same sentence does not change typeface between screens. */}
      <div className="facts">
        <span>
          Volume {volume} · {duration}
        </span>
      </div>
    </>
  )
}
