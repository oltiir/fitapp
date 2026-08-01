import { e1rm, sessionVolume, topSetKg, prefillSets, emptySet, entryFor } from './sets'
import type { Session, SetEntry } from '../types'

const set = (weightKg: number, reps: number, done = true): SetEntry => ({ weightKg, reps, done })

const session = (entries: Session['entries']): Session => ({
  id: 's1',
  split: 'push',
  date: '2026-08-01',
  startedAt: '2026-08-01T18:00:00.000Z',
  finishedAt: '2026-08-01T19:00:00.000Z',
  entries,
  restStartedAt: null,
  restSeconds: null,
})

describe('e1rm', () => {
  it('returns the lifted weight at 1 rep plus the Epley increment', () => {
    expect(e1rm(100, 1)).toBeCloseTo(103.333, 3)
  })

  it('rates more reps at the same weight higher', () => {
    expect(e1rm(80, 8)).toBeGreaterThan(e1rm(80, 5))
  })

  it('rates 80x8 above 85x5', () => {
    expect(e1rm(80, 8)).toBeCloseTo(101.333, 3)
    expect(e1rm(85, 5)).toBeCloseTo(99.167, 3)
  })

  it('rejects fewer than 1 rep', () => {
    expect(() => e1rm(80, 0)).toThrow()
  })
})

describe('sessionVolume', () => {
  it('sums weight times reps over done sets only', () => {
    const s = session([{ exerciseId: 'bench', sets: [set(80, 8), set(80, 8), set(80, 7, false)] }])
    expect(sessionVolume(s)).toBe(80 * 8 + 80 * 8)
  })

  it('is 0 for a session with nothing done', () => {
    expect(sessionVolume(session([{ exerciseId: 'bench', sets: [set(80, 8, false)] }]))).toBe(0)
  })

  it('sums across exercises', () => {
    const s = session([
      { exerciseId: 'bench', sets: [set(80, 8)] },
      { exerciseId: 'row', sets: [set(60, 10)] },
    ])
    expect(sessionVolume(s)).toBe(640 + 600)
  })
})

describe('topSetKg', () => {
  it('returns the heaviest done set', () => {
    const s = session([{ exerciseId: 'bench', sets: [set(80, 8), set(85, 5), set(75, 10)] }])
    expect(topSetKg(s, 'bench')).toBe(85)
  })

  it('ignores undone sets even when heavier', () => {
    const s = session([{ exerciseId: 'bench', sets: [set(80, 8), set(100, 1, false)] }])
    expect(topSetKg(s, 'bench')).toBe(80)
  })

  it('returns null when the exercise is absent', () => {
    expect(topSetKg(session([]), 'bench')).toBeNull()
  })

  it('returns null when the exercise has no done sets', () => {
    const s = session([{ exerciseId: 'bench', sets: [set(80, 8, false)] }])
    expect(topSetKg(s, 'bench')).toBeNull()
  })

  it('counts a bodyweight set at 0 kg rather than treating it as absent', () => {
    const s = session([{ exerciseId: 'dips', sets: [set(0, 12)] }])
    expect(topSetKg(s, 'dips')).toBe(0)
  })
})

describe('prefillSets', () => {
  it('copies weights and reps but marks nothing done', () => {
    expect(prefillSets([set(80, 8), set(80, 7)])).toEqual([
      { weightKg: 80, reps: 8, done: false },
      { weightKg: 80, reps: 7, done: false },
    ])
  })

  it('does not auto-increment the weight', () => {
    expect(prefillSets([set(80, 8)])[0]!.weightKg).toBe(80)
  })

  it('does not mutate the input', () => {
    const original = [set(80, 8)]
    prefillSets(original)
    expect(original[0]!.done).toBe(true)
  })

  it('returns one empty set for an empty history', () => {
    expect(prefillSets([])).toEqual([emptySet()])
  })
})

describe('entryFor', () => {
  it('finds the entry by exercise id', () => {
    const s = session([{ exerciseId: 'bench', sets: [] }])
    expect(entryFor(s, 'bench')?.exerciseId).toBe('bench')
  })

  it('returns undefined when absent', () => {
    expect(entryFor(session([]), 'bench')).toBeUndefined()
  })
})
