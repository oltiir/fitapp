import { useStore } from '../store/StoreContext'
import { personalRecord } from '../logic/history'
import { parseISODate } from '../logic/dates'
import { formatWeight } from '../logic/units'

export default function PrList() {
  const { data } = useStore()
  const unit = data.settings.unit

  const rows = data.exercises
    .filter((e) => !e.archived)
    .map((e) => ({ exercise: e, pr: personalRecord(data.sessions, e.id) }))
    .filter((r): r is { exercise: typeof r.exercise; pr: NonNullable<typeof r.pr> } => r.pr !== null)
    .sort((a, b) => b.pr.date.localeCompare(a.pr.date))

  if (rows.length === 0) {
    return (
      <div className="card">
        <div className="empty">No PRs yet — finish a workout first.</div>
      </div>
    )
  }

  return (
    <div className="card">
      {rows.map(({ exercise, pr }) => (
        <div className="pr-row" key={exercise.id}>
          <div className="grow">
            <div>{exercise.name}</div>
            <div className="sub">
              {parseISODate(pr.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono">
              {formatWeight(pr.weightKg, unit)} × {pr.reps}
            </div>
            <div className="sub mono">e1RM {Math.round(pr.e1rm * 10) / 10}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
