import {
  toDisplayWeight,
  fromDisplayWeight,
  formatWeight,
  formatSetSummary,
  paceSecPerKm,
  formatPace,
  formatDuration,
} from './units'
import type { Run, SetEntry } from '../types'

describe('weight conversion', () => {
  it('is identity in kg', () => {
    expect(toDisplayWeight(82.5, 'kg')).toBe(82.5)
    expect(fromDisplayWeight(82.5, 'kg')).toBe(82.5)
  })

  it('converts kg to lb', () => {
    expect(toDisplayWeight(100, 'lb')).toBeCloseTo(220.462, 3)
  })

  it('round-trips lb through storage without drift', () => {
    const stored = fromDisplayWeight(225, 'lb')
    expect(toDisplayWeight(stored, 'lb')).toBeCloseTo(225, 6)
  })

  it('formats without trailing zeros', () => {
    expect(formatWeight(80, 'kg')).toBe('80 kg')
    expect(formatWeight(82.5, 'kg')).toBe('82.5 kg')
  })

  it('formats lb in lb', () => {
    expect(formatWeight(100, 'lb')).toBe('220.5 lb')
  })
})

describe('formatSetSummary', () => {
  const set = (weightKg: number, reps: number): SetEntry => ({ weightKg, reps, done: true })

  it('collapses a shared weight into one figure', () => {
    expect(formatSetSummary([set(80, 8), set(80, 8), set(80, 7)], 'kg')).toBe('80 × 8,8,7')
  })

  it('spells out each set when the weight changes', () => {
    expect(formatSetSummary([set(80, 8), set(85, 5)], 'kg')).toBe('80×8, 85×5')
  })

  it('handles a single set', () => {
    expect(formatSetSummary([set(82.5, 8)], 'kg')).toBe('82.5 × 8')
  })

  it('returns a dash for no sets', () => {
    expect(formatSetSummary([], 'kg')).toBe('—')
  })

  it('converts to the display unit', () => {
    expect(formatSetSummary([set(100, 5)], 'lb')).toBe('220.5 × 5')
  })
})

describe('pace', () => {
  const run = (distanceKm: number, durationSec: number): Run => ({
    id: 'r1',
    date: '2026-08-01',
    distanceKm,
    durationSec,
  })

  it('computes seconds per kilometre', () => {
    expect(paceSecPerKm(run(5, 1590))).toBe(318)
  })

  it('returns null for zero distance rather than dividing by zero', () => {
    expect(paceSecPerKm(run(0, 600))).toBeNull()
  })

  it('formats pace as m:ss', () => {
    expect(formatPace(318)).toBe('5:18')
    expect(formatPace(305)).toBe('5:05')
  })

  it('formats duration under an hour as m:ss', () => {
    expect(formatDuration(1590)).toBe('26:30')
  })

  it('formats duration over an hour as h:mm:ss', () => {
    expect(formatDuration(3725)).toBe('1:02:05')
  })

  it('formats zero as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00')
  })
})
