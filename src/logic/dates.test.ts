import { toISODate, parseISODate, todayISO, daysBetween, weekBounds, datesInRange } from './dates'

describe('toISODate', () => {
  it('formats local calendar parts, not UTC', () => {
    // 00:30 local on 1 Aug — UTC-shifting would yield 31 Jul in positive offsets
    expect(toISODate(new Date(2026, 7, 1, 0, 30))).toBe('2026-08-01')
  })

  it('zero-pads month and day', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('parseISODate', () => {
  it('returns local midnight', () => {
    const d = parseISODate('2026-08-01')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(7)
    expect(d.getDate()).toBe(1)
    expect(d.getHours()).toBe(0)
  })

  it('round-trips with toISODate', () => {
    expect(toISODate(parseISODate('2026-02-29'))).toBe('2026-03-01') // 2026 is not a leap year
    expect(toISODate(parseISODate('2026-12-31'))).toBe('2026-12-31')
  })
})

describe('todayISO', () => {
  it('uses the injected clock', () => {
    expect(todayISO(new Date(2026, 6, 4, 23, 59))).toBe('2026-07-04')
  })
})

describe('daysBetween', () => {
  it('counts whole calendar days', () => {
    expect(daysBetween('2026-07-27', '2026-08-01')).toBe(5)
  })

  it('counts a late-night session as 1 day ago the next morning', () => {
    expect(daysBetween('2026-07-31', '2026-08-01')).toBe(1)
  })

  it('is 0 for the same day', () => {
    expect(daysBetween('2026-08-01', '2026-08-01')).toBe(0)
  })

  it('goes negative for future dates', () => {
    expect(daysBetween('2026-08-03', '2026-08-01')).toBe(-2)
  })

  it('crosses a DST boundary without drifting', () => {
    // EU DST ends 25 Oct 2026; a naive ms/86400000 division rounds wrong here
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
  })
})

describe('weekBounds', () => {
  it('starts Monday and ends Sunday', () => {
    // 2026-08-01 is a Saturday
    expect(weekBounds(new Date(2026, 7, 1, 12))).toEqual({ start: '2026-07-27', end: '2026-08-02' })
  })

  it('treats Sunday as the end of the week, not the start', () => {
    expect(weekBounds(new Date(2026, 7, 2, 12))).toEqual({ start: '2026-07-27', end: '2026-08-02' })
  })

  it('treats Monday as its own week start', () => {
    expect(weekBounds(new Date(2026, 7, 3, 0, 1))).toEqual({ start: '2026-08-03', end: '2026-08-09' })
  })

  it('spans a month boundary', () => {
    expect(weekBounds(new Date(2026, 6, 30, 12))).toEqual({ start: '2026-07-27', end: '2026-08-02' })
  })
})

describe('datesInRange', () => {
  it('is inclusive on both ends', () => {
    expect(datesInRange('2026-07-31', '2026-08-02')).toEqual([
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
    ])
  })

  it('returns a single date when start equals end', () => {
    expect(datesInRange('2026-08-01', '2026-08-01')).toEqual(['2026-08-01'])
  })
})
