import { useState } from 'react'
import { useStore } from '../store/StoreContext'
import Icon from './Icon'
import { toISODate, todayISO } from '../logic/dates'
import { attendedDates } from '../logic/attendance'
import { finishedSessions } from '../logic/history'
import { SPLIT_MARK, type Split } from '../types'

const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

interface Cell {
  iso: string
  day: number
  splits: Split[]
  hasRun: boolean
  attended: boolean
  today: boolean
}

/** The month as punched holes: a filled hole is a day you showed up. */
export default function MonthCalendar() {
  const { data } = useStore()
  const now = new Date()
  const today = todayISO(now)
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })

  const attended = attendedDates(data.sessions, data.visits)
  const runDates = new Set(data.runs.map((r) => r.date))

  const splitsByDate = new Map<string, Split[]>()
  for (const s of finishedSessions(data.sessions)) {
    const list = splitsByDate.get(s.date) ?? []
    list.unshift(s.split) // finishedSessions is newest-first
    splitsByDate.set(s.date, list)
  }

  const first = new Date(cursor.year, cursor.month, 1)
  const leading = (first.getDay() + 6) % 7 // Monday-start offset
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()

  const cells: (Cell | null)[] = Array.from({ length: leading }, () => null)
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = toISODate(new Date(cursor.year, cursor.month, day))
    cells.push({
      iso,
      day,
      splits: splitsByDate.get(iso) ?? [],
      hasRun: runDates.has(iso),
      attended: attended.has(iso),
      today: iso === today,
    })
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Cell | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const shift = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1)
    setCursor({ year: d.getFullYear(), month: d.getMonth() })
  }

  const monthTotal = cells.filter((c) => c?.attended).length

  return (
    <>
      <div className="rail">
        <button className="icon-btn" onClick={() => shift(-1)} aria-label="previous month">
          <Icon name="prev" size={20} />
        </button>
        <span className="where">
          {first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </span>
        <button className="icon-btn" onClick={() => shift(1)} aria-label="next month">
          <Icon name="next" size={20} />
        </button>
      </div>

      <div className="cal">
        {DOW.map((d, i) => (
          <div className="dow" key={`${d}-${i}`}>
            {d}
          </div>
        ))}
        <div className="dow">wk</div>

        {weeks.map((week, wi) => (
          <WeekRow key={wi} week={week} />
        ))}
      </div>

      <div className="legend">
        <span>PS = push</span>
        <span>PL = pull</span>
        <span>LG = legs</span>
        <span>
          <span className="dot-mark" /> = gym visit
        </span>
        <span>R = run</span>
      </div>

      <div className="readings">
        <div className="reading">
          <span className="k">Days trained this month</span>
          <span className="lead" />
          <span className="v">{monthTotal}</span>
        </div>
      </div>
    </>
  )
}

function WeekRow({ week }: { week: (Cell | null)[] }) {
  const count = week.filter((c) => c?.attended).length
  return (
    <>
      {week.map((cell, i) =>
        cell === null ? (
          <div className="day blank" key={`blank-${i}`} />
        ) : (
          <div
            className={`day${cell.attended ? ' attended' : ''}${cell.today ? ' today' : ''}`}
            key={cell.iso}
          >
            {/* The date always shows: replacing it with the split initial made
                attended days impossible to locate by date. A future day is told
                apart by having no mark — fading the date pushed it to 1.5:1. */}
            <span className="daynum">{cell.day}</span>
            <span className="marks">
              {cell.splits.length > 0
                ? cell.splits.map((s) => SPLIT_MARK[s]).join(' ')
                : cell.attended
                  ? <span className="dot-mark" />
                  : ''}
              {cell.hasRun && <span className="run">R</span>}
            </span>
          </div>
        ),
      )}
      <div className="wk">{count > 0 ? count : ''}</div>
    </>
  )
}
