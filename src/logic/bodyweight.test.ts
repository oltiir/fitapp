import { rollingAverage, weightChange } from './bodyweight'
import type { BodyWeight } from '../types'

const bw = (date: string, kg: number): BodyWeight => ({ id: date, date, kg })

describe('rollingAverage', () => {
  it('averages over a trailing inclusive window', () => {
    const points = rollingAverage([bw('2026-08-01', 82), bw('2026-08-02', 84)], 7)
    expect(points[0]!.avgKg).toBeCloseTo(82)
    expect(points[1]!.avgKg).toBeCloseTo(83)
  })

  it('excludes entries older than the window', () => {
    // 8 days apart: the first entry falls outside a 7-day trailing window
    const points = rollingAverage([bw('2026-07-24', 90), bw('2026-08-01', 80)], 7)
    expect(points[1]!.avgKg).toBeCloseTo(80)
  })

  it('includes an entry exactly at the window edge', () => {
    const points = rollingAverage([bw('2026-07-26', 90), bw('2026-08-01', 80)], 7)
    expect(points[1]!.avgKg).toBeCloseTo(85)
  })

  it('sorts unordered input by date', () => {
    const points = rollingAverage([bw('2026-08-02', 84), bw('2026-08-01', 82)], 7)
    expect(points.map((p) => p.date)).toEqual(['2026-08-01', '2026-08-02'])
  })

  it('returns the raw value as its own average for a single entry', () => {
    expect(rollingAverage([bw('2026-08-01', 82.4)], 7)).toEqual([
      { date: '2026-08-01', kg: 82.4, avgKg: 82.4 },
    ])
  })

  it('returns an empty array for no entries', () => {
    expect(rollingAverage([], 7)).toEqual([])
  })

  it('averages several entries on the same day', () => {
    const points = rollingAverage([bw('2026-08-01', 82), { id: 'x', date: '2026-08-01', kg: 84 }], 7)
    expect(points[1]!.avgKg).toBeCloseTo(83)
  })

  it('does not mutate the input array order', () => {
    const entries = [bw('2026-08-02', 84), bw('2026-08-01', 82)]
    rollingAverage(entries, 7)
    expect(entries[0]!.date).toBe('2026-08-02')
  })
})

describe('weightChange', () => {
  it('compares the latest reading against the newest one at least that old', () => {
    const entries = [bw('2026-07-04', 84), bw('2026-08-01', 82)]
    expect(weightChange(entries, 28, '2026-08-01')).toBeCloseTo(-2)
  })

  it('returns null without an entry old enough to compare', () => {
    expect(weightChange([bw('2026-08-01', 82)], 28, '2026-08-01')).toBeNull()
  })

  it('returns null for no entries', () => {
    expect(weightChange([], 28, '2026-08-01')).toBeNull()
  })

  it('reports a gain as positive', () => {
    const entries = [bw('2026-07-04', 80), bw('2026-08-01', 82)]
    expect(weightChange(entries, 28, '2026-08-01')).toBeCloseTo(2)
  })
})
