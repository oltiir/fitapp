import { useState } from 'react'
import { useStore } from '../store/StoreContext'
import LineChart, { type Series } from '../components/LineChart'
import QuickAddRun from '../components/QuickAddRun'
import QuickAddWeight from '../components/QuickAddWeight'
import Icon from '../components/Icon'
import { rollingAverage, weightChange } from '../logic/bodyweight'
import { daysBetween, parseISODate, todayISO } from '../logic/dates'
import {
  formatDuration,
  formatPace,
  formatWeight,
  paceSecPerKm,
  toDisplayWeight,
} from '../logic/units'

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
          color: 'var(--steel)',
          points: trend.map((p) => ({
            x: daysBetween(first.date, p.date),
            y: toDisplayWeight(p.kg, unit),
          })),
        },
        {
          kind: 'line',
          color: 'var(--chalk)',
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
  const totalKm = Math.round(runs.reduce((km, r) => km + r.distanceKm, 0) * 10) / 10

  return (
    <div className="screen">
      <header className="rail">
        <span className="where">Body</span>
        <span className="when">
          {weighIns.length} weigh-{weighIns.length === 1 ? 'in' : 'ins'}
        </span>
      </header>

      <h2 className="rule">Bodyweight</h2>
      <div className="plot">
        <LineChart
          series={series}
          xLabels={xLabels}
          emptyLabel="No weigh-ins yet — log one to start the trend."
        />
      </div>

      {latest && (
        <div className="readings">
          <div className="reading">
            <span className="k">Now</span>
            <span className="lead" />
            <span className="v">{formatWeight(latest.kg, unit)}</span>
          </div>
          <div className="reading">
            <span className="k">Change over 4 weeks</span>
            <span className="lead" />
            <span className="v">
              {change === null
                ? '—'
                : `${change > 0 ? '+' : ''}${
                    Math.round(toDisplayWeight(change, unit) * 10) / 10
                  } ${unit}`}
            </span>
          </div>
        </div>
      )}

      {trend.length > 0 && (
        <div className="tag-label" style={{ marginTop: "var(--s3)" }}>
          Dots are weigh-ins · the line is the 7-day average
        </div>
      )}

      <button
        className="steel-btn"
        style={{ marginTop: 'var(--s4)' }}
        onClick={() => setAddingWeight(true)}
      >
        <Icon name="plate" size={19} />+ log weight
      </button>

      {weighIns.length > 0 && (
        <div className="list" style={{ marginTop: 'var(--s4)' }}>
          {weighIns.map((b) => (
            <div className="list-item" key={b.id}>
              <div className="grow nm">{shortDate(b.date)}</div>
              <div className="val">{formatWeight(b.kg, unit)}</div>
              <button
                className="icon-btn danger"
                aria-label={`delete weigh-in from ${b.date}`}
                onClick={() => {
                  if (confirm(`Delete the ${formatWeight(b.kg, unit)} entry from ${b.date}?`)) {
                    void removeBodyWeight(b.id)
                  }
                }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="rule">Runs</h2>

      {runs.length > 0 && (
        <div className="readings">
          <div className="reading">
            <span className="k">Distance logged</span>
            <span className="lead" />
            <span className="v">{totalKm} km</span>
          </div>
          <div className="reading">
            <span className="k">Runs</span>
            <span className="lead" />
            <span className="v">{runs.length}</span>
          </div>
        </div>
      )}

      <button
        className="steel-btn"
        style={{ marginTop: 'var(--s3)' }}
        onClick={() => setAddingRun(true)}
      >
        <Icon name="road" size={19} />+ log run
      </button>

      {runs.length === 0 ? (
        <div className="empty">No runs logged yet.</div>
      ) : (
        <div className="list" style={{ marginTop: 'var(--s4)' }}>
          {runs.map((r) => {
            const pace = paceSecPerKm(r)
            return (
              <div className="list-item" key={r.id}>
                <div className="grow nm">{shortDate(r.date)}</div>
                <div className="val sub">
                  {r.distanceKm} km · {formatDuration(r.durationSec)}
                  {pace === null ? '' : ` · ${formatPace(pace)} /km`}
                </div>
                <button
                  className="icon-btn danger"
                  aria-label={`delete run from ${r.date}`}
                  onClick={() => {
                    if (confirm(`Delete the ${r.distanceKm} km run from ${r.date}?`)) {
                      void removeRun(r.id)
                    }
                  }}
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {addingRun && <QuickAddRun onClose={() => setAddingRun(false)} />}
      {addingWeight && <QuickAddWeight onClose={() => setAddingWeight(false)} />}
    </div>
  )
}
