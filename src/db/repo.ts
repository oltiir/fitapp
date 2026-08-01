import type { IDBPDatabase } from 'idb'
import type { FitDb } from './schema'
import {
  DEFAULT_SETTINGS,
  type BodyWeight,
  type Exercise,
  type FitData,
  type GymVisit,
  type ISODate,
  type Run,
  type Session,
  type Settings,
  type Template,
} from '../types'

type Db = IDBPDatabase<FitDb>

const SETTINGS_KEY = 'settings'

export class ActiveSessionConflictError extends Error {
  constructor() {
    super('A session is already in progress')
    this.name = 'ActiveSessionConflictError'
  }
}

export async function loadAll(db: Db): Promise<FitData> {
  const [exercises, templates, sessions, bodyweights, runs, visits, settings] = await Promise.all([
    db.getAll('exercises'),
    db.getAll('templates'),
    db.getAll('sessions'),
    db.getAll('bodyweights'),
    db.getAll('runs'),
    db.getAll('visits'),
    db.get('meta', SETTINGS_KEY) as Promise<Settings | undefined>,
  ])
  return {
    exercises,
    templates,
    sessions,
    bodyweights,
    runs,
    visits,
    settings: { ...DEFAULT_SETTINGS, ...(settings ?? {}) },
  }
}

export const putExercise = (db: Db, e: Exercise): Promise<void> =>
  db.put('exercises', e).then(() => undefined)
export const putTemplate = (db: Db, t: Template): Promise<void> =>
  db.put('templates', t).then(() => undefined)
export const putSession = (db: Db, s: Session): Promise<void> =>
  db.put('sessions', s).then(() => undefined)
export const putBodyWeight = (db: Db, b: BodyWeight): Promise<void> =>
  db.put('bodyweights', b).then(() => undefined)
export const putRun = (db: Db, r: Run): Promise<void> => db.put('runs', r).then(() => undefined)
export const putVisit = (db: Db, v: GymVisit): Promise<void> =>
  db.put('visits', v).then(() => undefined)
export const putSettings = (db: Db, s: Settings): Promise<void> =>
  db.put('meta', s, SETTINGS_KEY).then(() => undefined)

export const deleteSession = (db: Db, id: string): Promise<void> => db.delete('sessions', id)
export const deleteBodyWeight = (db: Db, id: string): Promise<void> => db.delete('bodyweights', id)
export const deleteRun = (db: Db, id: string): Promise<void> => db.delete('runs', id)
export const deleteVisit = (db: Db, date: ISODate): Promise<void> => db.delete('visits', date)
export const deleteExercise = (db: Db, id: string): Promise<void> => db.delete('exercises', id)

/**
 * Upholds the single-active-session invariant. The UI offers resume-or-discard
 * rather than ever letting two workouts run at once.
 */
export async function startSession(db: Db, session: Session): Promise<void> {
  const existing = await db.getAll('sessions')
  if (existing.some((s) => s.finishedAt === null && s.id !== session.id)) {
    throw new ActiveSessionConflictError()
  }
  await putSession(db, session)
}

/** Restore semantics: wipe, then install. Merge is where restore bugs live. */
export async function replaceAll(db: Db, data: FitData): Promise<void> {
  const stores = [
    'exercises',
    'templates',
    'sessions',
    'bodyweights',
    'runs',
    'visits',
    'meta',
  ] as const
  const tx = db.transaction(stores, 'readwrite')
  await Promise.all(stores.map((s) => tx.objectStore(s).clear()))
  await Promise.all([
    ...data.exercises.map((e) => tx.objectStore('exercises').put(e)),
    ...data.templates.map((t) => tx.objectStore('templates').put(t)),
    ...data.sessions.map((s) => tx.objectStore('sessions').put(s)),
    ...data.bodyweights.map((b) => tx.objectStore('bodyweights').put(b)),
    ...data.runs.map((r) => tx.objectStore('runs').put(r)),
    ...data.visits.map((v) => tx.objectStore('visits').put(v)),
    tx.objectStore('meta').put(data.settings, SETTINGS_KEY),
  ])
  await tx.done
}
