import { useState } from 'react'
import { useStore } from '../store/StoreContext'
import LineChart, { type Series } from '../components/LineChart'
import Icon from './Icon'
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
        { kind: 'line', color: 'var(--chalk)', points },
        { kind: 'dots', color: 'var(--chalk)', points },
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

  // The opinion: what the top set has done since the first record on file.
  const climb =
    points.length > 1 ? points[points.length - 1]!.y - points[0]!.y : null

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

      <div className="plot">
        <LineChart series={series} xLabels={xLabels} emptyLabel="No history for this exercise yet." />
      </div>

      {pr && (
        <div className="readings">
          <div className="reading">
            <span className="k">Record</span>
            <span className="lead" />
            <span className="v">
              {formatWeight(pr.weightKg, unit)} × {pr.reps}
            </span>
          </div>
          {/* Spelled out rather than "e1RM": the display face's 1 has no flag and
              no foot, so at label size the term rendered as "eIRM". */}
          <div className="reading">
            <span className="k">Est. one-rep max</span>
            <span className="lead" />
            <span className="v">{Math.round(pr.e1rm * 10) / 10}</span>
          </div>
          {climb !== null && climb !== 0 && (
            <div className="reading">
              <span className="k">Since first record</span>
              <span className="lead" />
              <span className="v">
                {climb > 0 ? '+' : ''}
                {Math.round(climb * 10) / 10} {unit}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="tag-label" style={{ marginTop: "var(--s3)" }}>
        Top set per session
      </div>

      {history.length > 0 && (
        <div className="list" style={{ marginTop: 'var(--s4)' }}>
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
                  <div className="grow nm">{shortDate(s.date)}</div>
                  <div className="val">
                    {formatSetSummary(done, unit)}
                    {isPr && (
                      <span className="pr-badge">
                        <Icon name="up" size={11} strokeWidth={2.8} /> PR
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </>
  )
}
