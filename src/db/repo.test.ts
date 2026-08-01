import { openFitDb } from './schema'
import {
  loadAll,
  putExercise,
  putSession,
  putBodyWeight,
  putVisit,
  putSettings,
  deleteBodyWeight,
  deleteVisit,
  replaceAll,
  startSession,
  ActiveSessionConflictError,
} from './repo'
import { DEFAULT_SETTINGS, type Exercise, type FitData, type Session } from '../types'

let dbCounter = 0
const freshDb = () => openFitDb(`test-${++dbCounter}`)

const exercise = (id: string): Exercise => ({
  id,
  name: id,
  restSeconds: 120,
  incrementKg: 2.5,
  archived: false,
  createdAt: '2026-08-01T10:00:00.000Z',
})

const session = (id: string, active = false): Session => ({
  id,
  split: 'push',
  date: '2026-08-01',
  startedAt: '2026-08-01T18:00:00.000Z',
  finishedAt: active ? null : '2026-08-01T19:00:00.000Z',
  entries: [],
  restStartedAt: null,
  restSeconds: null,
})

describe('loadAll', () => {
  it('returns empty collections and default settings for a fresh database', async () => {
    const data = await loadAll(await freshDb())
    expect(data.exercises).toEqual([])
    expect(data.sessions).toEqual([])
    expect(data.settings).toEqual(DEFAULT_SETTINGS)
  })
})

describe('round trips', () => {
  it('persists and reloads an exercise', async () => {
    const db = await freshDb()
    await putExercise(db, exercise('bench'))
    expect((await loadAll(db)).exercises).toEqual([exercise('bench')])
  })

  it('persists a session with nested sets intact', async () => {
    const db = await freshDb()
    const s = session('s1')
    s.entries = [{ exerciseId: 'bench', sets: [{ weightKg: 80, reps: 8, done: true }] }]
    await putSession(db, s)
    const loaded = (await loadAll(db)).sessions[0]!
    expect(loaded.entries[0]!.sets[0]!.weightKg).toBe(80)
  })

  it('overwrites on the same id rather than duplicating', async () => {
    const db = await freshDb()
    await putExercise(db, exercise('bench'))
    await putExercise(db, { ...exercise('bench'), name: 'Bench Press' })
    const { exercises } = await loadAll(db)
    expect(exercises).toHaveLength(1)
    expect(exercises[0]!.name).toBe('Bench Press')
  })

  it('persists settings', async () => {
    const db = await freshDb()
    await putSettings(db, { ...DEFAULT_SETTINGS, weeklyTarget: 5, unit: 'lb' })
    const { settings } = await loadAll(db)
    expect(settings.weeklyTarget).toBe(5)
    expect(settings.unit).toBe('lb')
  })

  it('deletes a bodyweight entry', async () => {
    const db = await freshDb()
    await putBodyWeight(db, { id: 'b1', date: '2026-08-01', kg: 82 })
    await deleteBodyWeight(db, 'b1')
    expect((await loadAll(db)).bodyweights).toEqual([])
  })
})

describe('visits', () => {
  it('is idempotent because the store is keyed by date', async () => {
    const db = await freshDb()
    await putVisit(db, { date: '2026-08-01' })
    await putVisit(db, { date: '2026-08-01' })
    expect((await loadAll(db)).visits).toHaveLength(1)
  })

  it('deletes by date', async () => {
    const db = await freshDb()
    await putVisit(db, { date: '2026-08-01' })
    await deleteVisit(db, '2026-08-01')
    expect((await loadAll(db)).visits).toEqual([])
  })
})

describe('startSession', () => {
  it('stores the session when none is active', async () => {
    const db = await freshDb()
    await startSession(db, session('s1', true))
    expect((await loadAll(db)).sessions).toHaveLength(1)
  })

  it('rejects a second active session, upholding the single-active invariant', async () => {
    const db = await freshDb()
    await startSession(db, session('s1', true))
    await expect(startSession(db, session('s2', true))).rejects.toThrow(ActiveSessionConflictError)
  })

  it('allows a new session once the previous one is finished', async () => {
    const db = await freshDb()
    await startSession(db, session('s1', true))
    await putSession(db, session('s1')) // same id, now finished
    await startSession(db, session('s2', true))
    expect((await loadAll(db)).sessions).toHaveLength(2)
  })

  it('allows re-saving the same active session', async () => {
    const db = await freshDb()
    await startSession(db, session('s1', true))
    await expect(startSession(db, session('s1', true))).resolves.toBeUndefined()
  })
})

describe('replaceAll', () => {
  it('wipes existing records and installs the supplied data', async () => {
    const db = await freshDb()
    await putExercise(db, exercise('old'))
    await putSession(db, session('s-old'))

    const incoming: FitData = {
      exercises: [exercise('new')],
      templates: [{ split: 'push', exerciseIds: ['new'], updatedAt: '2026-08-01T10:00:00.000Z' }],
      sessions: [session('s-new')],
      bodyweights: [{ id: 'b1', date: '2026-08-01', kg: 82 }],
      runs: [{ id: 'r1', date: '2026-08-01', distanceKm: 5, durationSec: 1590 }],
      visits: [{ date: '2026-07-30' }],
      settings: { ...DEFAULT_SETTINGS, weeklyTarget: 4 },
    }
    await replaceAll(db, incoming)

    const data = await loadAll(db)
    expect(data.exercises.map((e) => e.id)).toEqual(['new'])
    expect(data.sessions.map((s) => s.id)).toEqual(['s-new'])
    expect(data.templates).toHaveLength(1)
    expect(data.runs).toHaveLength(1)
    expect(data.visits).toHaveLength(1)
    expect(data.settings.weeklyTarget).toBe(4)
  })

  it('leaves the database empty when given empty data', async () => {
    const db = await freshDb()
    await putExercise(db, exercise('old'))
    await replaceAll(db, {
      exercises: [],
      templates: [],
      sessions: [],
      bodyweights: [],
      runs: [],
      visits: [],
      settings: DEFAULT_SETTINGS,
    })
    expect((await loadAll(db)).exercises).toEqual([])
  })
})
