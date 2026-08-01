import { useState } from 'react'
import { useStore } from '../store/StoreContext'
import { toISODate, todayISO } from '../logic/dates'
import { attendedDates } from '../logic/attendance'
import { finishedSessions } from '../logic/history'
import type { Split } from '../types'

const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const SPLIT_INITIAL: Record<Split, string> = { push: 'P', pull: 'P', legs: 'L' }

interface Cell {
  iso: string
  day: number
  splits: Split[]
  hasRun: boolean
  attended: boolean
  future: boolean
}

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
      future: iso > today,
    })
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Cell | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const shift = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1)
    setCursor({ year: d.getFullYear(), month: d.getMonth() })
  }

  return (
    <>
      <div className="spread" style={{ marginBottom: 10 }}>
        <button className="btn btn-sm btn-ghost" onClick={() => shift(-1)} aria-label="previous month">
          ‹
        </button>
        <strong>
          {first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </strong>
        <button className="btn btn-sm btn-ghost" onClick={() => shift(1)} aria-label="next month">
          ›
        </button>
      </div>

      <div className="card">
        <div className="cal">
          {DOW.map((d) => (
            <div className="dow" key={d}>
              {d}
            </div>
          ))}
          <div className="dow">wk</div>

          {weeks.map((week, wi) => (
            <WeekRow key={wi} week={week} />
          ))}
        </div>

        <div className="sub" style={{ marginTop: 12 }}>
          P = push/pull · L = legs · • = gym visit · R = run
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
            className={`day${cell.attended ? ' attended' : ''}${cell.future ? ' future' : ''}`}
            key={cell.iso}
          >
            {/* The date always shows: replacing it with the split initial made
                attended days impossible to locate by date. */}
            <span className="daynum">{cell.day}</span>
            <span className="marks">
              {cell.splits.length > 0
                ? cell.splits.map((s) => SPLIT_INITIAL[s]).join('')
                : cell.attended
                  ? '•'
                  : ''}
              {cell.hasRun && <span className="run">R</span>}
            </span>
          </div>
        ),
      )}
      <div className="wk mono">{count > 0 ? count : ''}</div>
    </>
  )
}
