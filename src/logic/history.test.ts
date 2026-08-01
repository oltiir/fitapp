import { lastPerformance, personalRecord, finishedSessions, activeSession } from './history'
import type { Session, SetEntry } from '../types'

const set = (weightKg: number, reps: number, done = true): SetEntry => ({ weightKg, reps, done })

let counter = 0
const session = (
  date: string,
  entries: Session['entries'],
  opts: { split?: Session['split']; active?: boolean } = {},
): Session => ({
  id: `s${++counter}`,
  split: opts.split ?? 'push',
  date,
  startedAt: `${date}T18:00:00.000Z`,
  finishedAt: opts.active ? null : `${date}T19:00:00.000Z`,
  entries,
  restStartedAt: null,
  restSeconds: null,
})

describe('lastPerformance', () => {
  it('returns the most recent finished session containing the exercise', () => {
    const sessions = [
      session('2026-07-18', [{ exerciseId: 'bench', sets: [set(80, 7)] }]),
      session('2026-07-27', [{ exerciseId: 'bench', sets: [set(80, 8), set(80, 8), set(80, 7)] }]),
    ]
    const result = lastPerformance(sessions, 'bench', '2026-08-01')
    expect(result).not.toBeNull()
    expect(result!.date).toBe('2026-07-27')
    expect(result!.daysAgo).toBe(5)
    expect(result!.sets).toHaveLength(3)
  })

  it('ignores the active session so an in-progress workout cannot prefill itself', () => {
    const sessions = [
      session('2026-07-27', [{ exerciseId: 'bench', sets: [set(80, 8)] }]),
      session('2026-08-01', [{ exerciseId: 'bench', sets: [set(95, 1)] }], { active: true }),
    ]
    expect(lastPerformance(sessions, 'bench', '2026-08-01')!.date).toBe('2026-07-27')
  })

  it('skips sessions where the exercise was present but never completed', () => {
    const sessions = [
      session('2026-07-20', [{ exerciseId: 'bench', sets: [set(80, 8)] }]),
      session('2026-07-27', [{ exerciseId: 'bench', sets: [set(85, 5, false)] }]),
    ]
    expect(lastPerformance(sessions, 'bench', '2026-08-01')!.date).toBe('2026-07-20')
  })

  it('finds history across splits when an exercise moves between templates', () => {
    const sessions = [
      session('2026-07-20', [{ exerciseId: 'facepull', sets: [set(20, 15)] }], { split: 'push' }),
      session('2026-07-28', [{ exerciseId: 'facepull', sets: [set(22.5, 15)] }], { split: 'pull' }),
    ]
    const result = lastPerformance(sessions, 'facepull', '2026-08-01')
    expect(result!.date).toBe('2026-07-28')
    expect(result!.sets[0]!.weightKg).toBe(22.5)
  })

  it('returns null with no history', () => {
    expect(lastPerformance([], 'bench', '2026-08-01')).toBeNull()
  })

  it('returns only that exercise’s sets, not the whole session', () => {
    const sessions = [
      session('2026-07-27', [
        { exerciseId: 'bench', sets: [set(80, 8)] },
        { exerciseId: 'row', sets: [set(60, 10), set(60, 10)] },
      ]),
    ]
    expect(lastPerformance(sessions, 'bench', '2026-08-01')!.sets).toHaveLength(1)
  })

  it('returns only done sets, dropping the ones left unfinished', () => {
    const sessions = [
      session('2026-07-27', [{ exerciseId: 'bench', sets: [set(80, 8), set(80, 8, false)] }]),
    ]
    expect(lastPerformance(sessions, 'bench', '2026-08-01')!.sets).toHaveLength(1)
  })
})

describe('personalRecord', () => {
  it('picks the set with the highest estimated 1RM', () => {
    const sessions = [
      session('2026-07-20', [{ exerciseId: 'bench', sets: [set(85, 5)] }]),
      session('2026-07-27', [{ exerciseId: 'bench', sets: [set(80, 8)] }]),
    ]
    const pr = personalRecord(sessions, 'bench')
    expect(pr!.weightKg).toBe(80)
    expect(pr!.reps).toBe(8)
    expect(pr!.date).toBe('2026-07-27')
  })

  it('breaks a tie on estimated 1RM in favour of the heavier absolute weight', () => {
    // Both score exactly 120: 60 x 30 and 100 x 6
    const sessions = [
      session('2026-07-20', [{ exerciseId: 'bench', sets: [set(60, 30)] }]),
      session('2026-07-27', [{ exerciseId: 'bench', sets: [set(100, 6)] }]),
    ]
    const pr = personalRecord(sessions, 'bench')
    expect(pr!.e1rm).toBeCloseTo(120, 6)
    expect(pr!.weightKg).toBe(100)
  })

  it('breaks that tie the same way regardless of which session is newer', () => {
    const sessions = [
      session('2026-07-20', [{ exerciseId: 'bench', sets: [set(100, 6)] }]),
      session('2026-07-27', [{ exerciseId: 'bench', sets: [set(60, 30)] }]),
    ]
    expect(personalRecord(sessions, 'bench')!.weightKg).toBe(100)
  })

  it('ignores undone sets', () => {
    const sessions = [
      session('2026-07-27', [{ exerciseId: 'bench', sets: [set(80, 8), set(200, 1, false)] }]),
    ]
    expect(personalRecord(sessions, 'bench')!.weightKg).toBe(80)
  })

  it('ignores the active session', () => {
    const sessions = [
      session('2026-07-27', [{ exerciseId: 'bench', sets: [set(80, 8)] }]),
      session('2026-08-01', [{ exerciseId: 'bench', sets: [set(200, 1)] }], { active: true }),
    ]
    expect(personalRecord(sessions, 'bench')!.weightKg).toBe(80)
  })

  it('ignores 0-rep sets rather than throwing', () => {
    const sessions = [session('2026-07-27', [{ exerciseId: 'bench', sets: [set(80, 0), set(75, 5)] }])]
    expect(personalRecord(sessions, 'bench')!.weightKg).toBe(75)
  })

  it('returns null with no history', () => {
    expect(personalRecord([], 'bench')).toBeNull()
  })
})

describe('finishedSessions', () => {
  it('excludes the active session and sorts newest first', () => {
    const sessions = [
      session('2026-07-20', []),
      session('2026-07-28', []),
      session('2026-08-01', [], { active: true }),
    ]
    expect(finishedSessions(sessions).map((s) => s.date)).toEqual(['2026-07-28', '2026-07-20'])
  })

  it('does not mutate the input array order', () => {
    const sessions = [session('2026-07-20', []), session('2026-07-28', [])]
    const firstId = sessions[0]!.id
    finishedSessions(sessions)
    expect(sessions[0]!.id).toBe(firstId)
  })
})

describe('activeSession', () => {
  it('returns the unfinished session', () => {
    const active = session('2026-08-01', [], { active: true })
    expect(activeSession([session('2026-07-20', []), active])?.id).toBe(active.id)
  })

  it('returns undefined when all sessions are finished', () => {
    expect(activeSession([session('2026-07-20', [])])).toBeUndefined()
  })
})
