import { useState } from 'react'
import { useStore } from '../store/StoreContext'
import LineChart, { type Series } from '../components/LineChart'
import { daysBetween, parseISODate } from '../logic/dates'
import { finishedSessions, personalRecord } from '../logic/history'
import { entryFor, topSetKg } from '../logic/sets'
import { formatSetSummary, formatWeight, toDisplayWeight } from '../logic/units'

const shortDate = (iso: string) =>
  parseISODate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export default function ExerciseProgress() {
  const { data } = useStore()
  const unit = data.settings.unit

  const selectable = data.exercises.filter((e) => !e.archived)
  const pushTemplate = data.templates.find((t) => t.split === 'push')
  const defaultId = pushTemplate?.exerciseIds[0] ?? selectable[0]?.id ?? ''
  const [exerciseId, setExerciseId] = useState(defaultId)

  const history = finishedSessions(data.sessions)
    .filter((s) => topSetKg(s, exerciseId) !== null)
    .reverse() // oldest first, for charting

  const firstDate = history[0]?.date
  const pr = personalRecord(data.sessions, exerciseId)

  const points = firstDate
    ? history.map((s) => ({
        x: daysBetween(firstDate, s.date),
        y: toDisplayWeight(topSetKg(s, exerciseId)!, unit),
      }))
    : []

  const series: Series[] = points.length
    ? [
        { kind: 'line', color: 'var(--accent)', points },
        { kind: 'dots', color: 'var(--accent)', points },
      ]
    : []

  const lastDate = history[history.length - 1]?.date
  const xLabels =
    firstDate && lastDate && history.length > 1
      ? [
          { x: 0, label: shortDate(firstDate) },
          { x: daysBetween(firstDate, lastDate), label: shortDate(lastDate) },
        ]
      : []

  return (
    <>
      <div className="field">
        <label htmlFor="exercise-pick">Exercise</label>
        <select
          id="exercise-pick"
          value={exerciseId}
          onChange={(e) => setExerciseId(e.target.value)}
        >
          {selectable.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <LineChart
          series={series}
          xLabels={xLabels}
          emptyLabel="No history for this exercise yet."
        />
        {pr && (
          <div className="stat">
            <div>
              <div className="label">PR</div>
              <div className="value">
                {formatWeight(pr.weightKg, unit)} × {pr.reps}
              </div>
            </div>
            <div>
              <div className="label">Best e1RM</div>
              <div className="value">{Math.round(pr.e1rm * 10) / 10}</div>
            </div>
          </div>
        )}
        <div className="sub" style={{ marginTop: 8 }}>
          Top set per session.
        </div>
      </div>

      {history.length > 0 && (
        <div className="card">
          {history
            .slice()
            .reverse()
            .map((s) => {
              const done = entryFor(s, exerciseId)?.sets.filter((x) => x.done) ?? []
              // Matched on session id, not date: two sessions on one day would
              // otherwise both be badged as the PR.
              const isPr = pr !== null && s.id === pr.sessionId
              return (
                <div className="list-item" key={s.id}>
                  <div className="grow">{shortDate(s.date)}</div>
                  <div className="mono">
                    {formatSetSummary(done, unit)}
                    {isPr && <span className="pr-badge">↑ PR</span>}
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </>
  )
}
