import {
  nextSplit,
  attendedDates,
  attendedToday,
  weekAttendance,
  daysSince,
  daysSinceAll,
  STALE_SPLIT_DAYS,
} from './attendance'
import type { Session, Split } from '../types'

let counter = 0
const session = (date: string, split: Split, active = false): Session => ({
  id: `s${++counter}`,
  split,
  date,
  startedAt: `${date}T18:00:00.000Z`,
  finishedAt: active ? null : `${date}T19:00:00.000Z`,
  entries: [],
  restStartedAt: null,
  restSeconds: null,
})

describe('nextSplit', () => {
  it('starts at push with no history', () => {
    expect(nextSplit([])).toBe('push')
  })

  it('advances push to pull', () => {
    expect(nextSplit([session('2026-07-30', 'push')])).toBe('pull')
  })

  it('advances pull to legs', () => {
    expect(nextSplit([session('2026-07-30', 'pull')])).toBe('legs')
  })

  it('wraps legs back to push', () => {
    expect(nextSplit([session('2026-07-30', 'legs')])).toBe('push')
  })

  it('follows a repeated split without correcting it', () => {
    const sessions = [session('2026-07-28', 'push'), session('2026-07-30', 'push')]
    expect(nextSplit(sessions)).toBe('pull')
  })

  it('ignores the active session so starting a workout does not advance the suggestion', () => {
    const sessions = [session('2026-07-30', 'push'), session('2026-08-01', 'legs', true)]
    expect(nextSplit(sessions)).toBe('pull')
  })
})

describe('attendedDates', () => {
  it('includes finished sessions and manual visits', () => {
    const dates = attendedDates([session('2026-07-30', 'push')], [{ date: '2026-07-31' }])
    expect([...dates].sort()).toEqual(['2026-07-30', '2026-07-31'])
  })

  it('counts a session and a visit on the same day once', () => {
    const dates = attendedDates([session('2026-07-30', 'push')], [{ date: '2026-07-30' }])
    expect(dates.size).toBe(1)
  })

  it('excludes the active session — attendance requires finishing or a manual mark', () => {
    expect(attendedDates([session('2026-08-01', 'push', true)], []).size).toBe(0)
  })
})

describe('attendedToday', () => {
  const now = new Date(2026, 7, 1, 20)

  it('is true from a finished session today', () => {
    expect(attendedToday([session('2026-08-01', 'push')], [], now)).toBe(true)
  })

  it('is true from a manual visit today', () => {
    expect(attendedToday([], [{ date: '2026-08-01' }], now)).toBe(true)
  })

  it('is false from an active session alone', () => {
    expect(attendedToday([session('2026-08-01', 'push', true)], [], now)).toBe(false)
  })

  it('is false when nothing happened today', () => {
    expect(attendedToday([session('2026-07-31', 'push')], [], now)).toBe(false)
  })
})

describe('weekAttendance', () => {
  const now = new Date(2026, 7, 1, 12) // Saturday; week is 2026-07-27..2026-08-02

  it('counts only days inside the Monday-start week', () => {
    const sessions = [
      session('2026-07-26', 'push'), // previous week
      session('2026-07-27', 'push'),
      session('2026-07-29', 'pull'),
      session('2026-08-01', 'legs'),
    ]
    const result = weekAttendance(sessions, [], now)
    expect(result.count).toBe(3)
    expect(result.dates).toEqual(['2026-07-27', '2026-07-29', '2026-08-01'])
  })

  it('includes manual visits in the count', () => {
    const result = weekAttendance([session('2026-07-27', 'push')], [{ date: '2026-07-28' }], now)
    expect(result.count).toBe(2)
  })

  it('maps splits per date and leaves manual visits with no split', () => {
    const result = weekAttendance([session('2026-07-27', 'push')], [{ date: '2026-07-28' }], now)
    expect(result.splitsByDate['2026-07-27']).toEqual(['push'])
    expect(result.splitsByDate['2026-07-28']).toBeUndefined()
  })

  it('records two splits when a day holds two sessions', () => {
    const sessions = [session('2026-07-27', 'push'), session('2026-07-27', 'pull')]
    expect(weekAttendance(sessions, [], now).splitsByDate['2026-07-27']).toEqual(['push', 'pull'])
    expect(weekAttendance(sessions, [], now).count).toBe(1) // one attended DAY
  })

  it('is 0 for an empty history', () => {
    expect(weekAttendance([], [], now).count).toBe(0)
  })
})

describe('daysSince', () => {
  it('counts calendar days since the last session of that split', () => {
    expect(daysSince([session('2026-07-30', 'push')], 'push', '2026-08-01')).toBe(2)
  })

  it('returns null when the split has never been trained', () => {
    expect(daysSince([session('2026-07-30', 'push')], 'legs', '2026-08-01')).toBeNull()
  })

  it('returns 0 for a session today', () => {
    expect(daysSince([session('2026-08-01', 'push')], 'push', '2026-08-01')).toBe(0)
  })

  it('marks exactly 7 days as not yet stale', () => {
    expect(daysSince([session('2026-07-25', 'legs')], 'legs', '2026-08-01')).toBe(7)
    expect(7 > STALE_SPLIT_DAYS).toBe(false)
  })

  it('marks 8 days as stale', () => {
    expect(daysSince([session('2026-07-24', 'legs')], 'legs', '2026-08-01')! > STALE_SPLIT_DAYS).toBe(
      true,
    )
  })

  it('ignores the active session', () => {
    expect(daysSince([session('2026-08-01', 'push', true)], 'push', '2026-08-01')).toBeNull()
  })
})

describe('daysSinceAll', () => {
  it('reports every split', () => {
    const sessions = [session('2026-07-30', 'push'), session('2026-07-27', 'pull')]
    expect(daysSinceAll(sessions, '2026-08-01')).toEqual({ push: 2, pull: 5, legs: null })
  })
})
