import { datesInRange, weekBounds } from '../logic/dates'
import type { WeekAttendance } from '../logic/attendance'
import { SPLIT_MARK, type ISODate } from '../types'

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/**
 * The week as a punched leather belt: one hole per day, a chalk plug in the days
 * you trained stamped with the split, a chalk dash under a day you ran.
 *
 * The holes are really cut — a repeating radial mask removes the tan from each
 * day column so the floor shows through. The plugs therefore have to live in a
 * sibling layer: a child of the strap would be masked away along with it.
 *
 * Replaces a progress ring deliberately. A ring gives one number; the belt gives
 * the same number *and* which days, which split, and where today sits, in the
 * same space and legible at arm's length.
 */
export default function BeltStrip({
  now,
  week,
  runDates,
  target,
  today,
}: {
  now: Date
  week: WeekAttendance
  runDates: Set<ISODate>
  target: number
  today: ISODate
}) {
  const { start, end } = weekBounds(now)
  const days = datesInRange(start, end)
  const attended = new Set(week.dates)

  return (
    <div className="belt-row">
      <div className="belt">
        <div className="strap-face" />
        <div className="stitch" />
        <div className="dows" aria-hidden="true">
          {DOW.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="plugs">
          {days.map((iso) => {
            const splits = week.splitsByDate[iso] ?? []
            const filled = attended.has(iso)
            const mark = splits.map((s) => SPLIT_MARK[s]).join(' ')
            const label = filled
              ? `${iso}: ${splits.length > 0 ? splits.join(' and ') : 'gym visit'}`
              : `${iso}: nothing logged`

            return (
              <div className="slot" key={iso} role="img" aria-label={label}>
                {iso === today && <span className="today-ring" />}
                {filled && (
                  <span className="plug">
                    {mark || <span className="dot-mark" />}
                  </span>
                )}
                {runDates.has(iso) && <span className="runmark" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* One text node, so the week's score reads as a single figure. */}
      <span className="belt-tally">
        {week.count} / {target}
      </span>
    </div>
  )
}
