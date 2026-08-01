import { useState } from 'react'
import { useStore } from '../store/StoreContext'
import LineChart, { type Series } from '../components/LineChart'
import QuickAddRun from '../components/QuickAddRun'
import QuickAddWeight from '../components/QuickAddWeight'
import { rollingAverage, weightChange } from '../logic/bodyweight'
import { daysBetween, parseISODate, todayISO } from '../logic/dates'
import { formatDuration, formatPace, formatWeight, paceSecPerKm, toDisplayWeight } from '../logic/units'

const shortDate = (iso: string) =>
  parseISODate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export default function BodyScreen() {
  const { data, removeBodyWeight, removeRun } = useStore()
  const [addingRun, setAddingRun] = useState(false)
  const [addingWeight, setAddingWeight] = useState(false)

  const unit = data.settings.unit
  const today = todayISO(new Date())

  const trend = rollingAverage(data.bodyweights, 7)
  const first = trend[0]
  const latest = trend[trend.length - 1]
  const change = weightChange(data.bodyweights, 28, today)

  const series: Series[] = first
    ? [
        {
          kind: 'dots',
          color: 'var(--dim)',
          points: trend.map((p) => ({
            x: daysBetween(first.date, p.date),
            y: toDisplayWeight(p.kg, unit),
          })),
        },
        {
          kind: 'line',
          color: 'var(--accent)',
          points: trend.map((p) => ({
            x: daysBetween(first.date, p.date),
            y: toDisplayWeight(p.avgKg, unit),
          })),
        },
      ]
    : []

  const xLabels =
    first && latest && trend.length > 1
      ? [
          { x: 0, label: shortDate(first.date) },
          { x: daysBetween(first.date, latest.date), label: shortDate(latest.date) },
        ]
      : []

  const weighIns = data.bodyweights.slice().sort((a, b) => b.date.localeCompare(a.date))
  const runs = data.runs.slice().sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="screen">
      <h1>Body</h1>

      <h2>Bodyweight</h2>
      <div className="card">
        <LineChart
          series={series}
          xLabels={xLabels}
          emptyLabel="No weigh-ins yet — log one to start the trend."
        />
        {latest && (
          <div className="stat">
            <div>
              <div className="label">Now</div>
              <div className="value">{formatWeight(latest.kg, unit)}</div>
            </div>
            <div>
              <div className="label">4 wk</div>
              <div
                className={`value ${change === null ? '' : change < 0 ? 'down' : change > 0 ? 'up' : ''}`}
              >
                {change === null
                  ? '—'
                  : `${change > 0 ? '+' : ''}${Math.round(toDisplayWeight(change, unit) * 10) / 10} ${unit}`}
              </div>
            </div>
          </div>
        )}
        {trend.length > 0 && (
          <div className="sub" style={{ marginTop: 8 }}>
            Dots are individual weigh-ins; the line is the 7-day average.
          </div>
        )}
      </div>

      <button className="btn" onClick={() => setAddingWeight(true)}>
        + log weight
      </button>

      {weighIns.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          {weighIns.map((b) => (
            <div className="list-item" key={b.id}>
              <div className="grow">{shortDate(b.date)}</div>
              <div className="mono">{formatWeight(b.kg, unit)}</div>
              <button
                className="icon-btn btn-danger"
                aria-label={`delete weigh-in from ${b.date}`}
                onClick={() => {
                  if (confirm(`Delete the ${formatWeight(b.kg, unit)} entry from ${b.date}?`)) {
                    void removeBodyWeight(b.id)
                  }
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <h2>Runs</h2>
      <button className="btn" onClick={() => setAddingRun(true)}>
        + log run
      </button>

      <div className="card" style={{ marginTop: 12 }}>
        {runs.length === 0 ? (
          <div className="empty">No runs logged yet.</div>
        ) : (
          runs.map((r) => {
            const pace = paceSecPerKm(r)
            return (
              <div className="list-item" key={r.id}>
                <div className="grow">{shortDate(r.date)}</div>
                <div className="mono sub">
                  {r.distanceKm} km · {formatDuration(r.durationSec)}
                  {pace === null ? '' : ` · ${formatPace(pace)} /km`}
                </div>
                <button
                  className="icon-btn btn-danger"
                  aria-label={`delete run from ${r.date}`}
                  onClick={() => {
                    if (confirm(`Delete the ${r.distanceKm} km run from ${r.date}?`)) {
                      void removeRun(r.id)
                    }
                  }}
                >
                  ✕
                </button>
              </div>
            )
          })
        )}
      </div>

      {addingRun && <QuickAddRun onClose={() => setAddingRun(false)} />}
      {addingWeight && <QuickAddWeight onClose={() => setAddingWeight(false)} />}
    </div>
  )
}
