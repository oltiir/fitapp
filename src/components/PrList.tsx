import { useStore } from '../store/StoreContext'
import { personalRecord } from '../logic/history'
import { parseISODate } from '../logic/dates'
import { formatWeight } from '../logic/units'
import Icon from './Icon'

export default function PrList() {
  const { data } = useStore()
  const unit = data.settings.unit

  const rows = data.exercises
    .filter((e) => !e.archived)
    .map((e) => ({ exercise: e, pr: personalRecord(data.sessions, e.id) }))
    .filter((r): r is { exercise: typeof r.exercise; pr: NonNullable<typeof r.pr> } => r.pr !== null)
    .sort((a, b) => b.pr.date.localeCompare(a.pr.date))

  if (rows.length === 0) {
    return <div className="empty">No records yet — finish a workout first.</div>
  }

  return (
    <div className="list">
      {rows.map(({ exercise, pr }, i) => (
        <div className="pr-row" key={exercise.id}>
          <div className="grow">
            <div className="nm">{exercise.name}</div>
            <div className="sub">
              {parseISODate(pr.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
          <div>
            {/* Only the single most recent record is stamped. Stamping every row
                that shares the newest date put six identical stamps on screen,
                and a stamp on everything marks nothing. */}
            {i === 0 && (
              <div style={{ textAlign: 'right', marginBottom: 4 }}>
                <span className="stamp">
                  <Icon name="up" size={11} strokeWidth={2.8} />
                  Latest
                </span>
              </div>
            )}
            <div className="load">
              {formatWeight(pr.weightKg, unit)} × {pr.reps}
            </div>
            <div className="sub num" style={{ textAlign: 'right' }}>
              e1RM {Math.round(pr.e1rm * 10) / 10}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
