import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { IDBPDatabase } from 'idb'
import { openFitDb, type FitDb } from '../db/schema'
import * as repo from '../db/repo'
import { seedData } from '../logic/seed'
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

const EMPTY: FitData = {
  exercises: [],
  templates: [],
  sessions: [],
  bodyweights: [],
  runs: [],
  visits: [],
  settings: DEFAULT_SETTINGS,
}

export interface StoreValue {
  data: FitData
  ready: boolean
  error: string | null
  saveExercise(e: Exercise): Promise<void>
  removeExercise(id: string): Promise<void>
  saveTemplate(t: Template): Promise<void>
  saveSession(s: Session): Promise<void>
  beginSession(s: Session): Promise<void>
  removeSession(id: string): Promise<void>
  saveBodyWeight(b: BodyWeight): Promise<void>
  removeBodyWeight(id: string): Promise<void>
  saveRun(r: Run): Promise<void>
  removeRun(id: string): Promise<void>
  saveVisit(v: GymVisit): Promise<void>
  removeVisit(date: ISODate): Promise<void>
  saveSettings(s: Settings): Promise<void>
  importData(d: FitData): Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

function upsert<T>(list: T[], item: T, key: (t: T) => unknown): T[] {
  const i = list.findIndex((x) => key(x) === key(item))
  if (i === -1) return [...list, item]
  const next = list.slice()
  next[i] = item
  return next
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<IDBPDatabase<FitDb> | null>(null)
  const [data, setData] = useState<FitData>(EMPTY)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const opened = await openFitDb()
        let loaded = await repo.loadAll(opened)

        // First run: install the default PPL routine so the app is usable immediately.
        // Seed ids are fixed, so StrictMode's double-invoke re-puts the same records
        // rather than duplicating them.
        if (loaded.exercises.length === 0 && loaded.templates.length === 0) {
          const seed = seedData(new Date())
          for (const e of seed.exercises) await repo.putExercise(opened, e)
          for (const t of seed.templates) await repo.putTemplate(opened, t)
          loaded = await repo.loadAll(opened)
        }

        if (cancelled) return
        setDb(opened)
        setData(loaded)
        setReady(true)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  /** Write-through: persist first, then reflect in state. A failed write never reads as success. */
  async function mutate(
    write: (db: IDBPDatabase<FitDb>) => Promise<unknown>,
    apply: (d: FitData) => FitData,
  ): Promise<void> {
    if (!db) throw new Error('Database not ready')
    await write(db)
    setData(apply)
  }

  const value: StoreValue = {
    data,
    ready,
    error,

    saveExercise: (e) =>
      mutate(
        (d) => repo.putExercise(d, e),
        (prev) => ({ ...prev, exercises: upsert(prev.exercises, e, (x) => x.id) }),
      ),
    removeExercise: (id) =>
      mutate(
        (d) => repo.deleteExercise(d, id),
        (prev) => ({ ...prev, exercises: prev.exercises.filter((x) => x.id !== id) }),
      ),

    saveTemplate: (t) =>
      mutate(
        (d) => repo.putTemplate(d, t),
        (prev) => ({ ...prev, templates: upsert(prev.templates, t, (x) => x.split) }),
      ),

    saveSession: (s) =>
      mutate(
        (d) => repo.putSession(d, s),
        (prev) => ({ ...prev, sessions: upsert(prev.sessions, s, (x) => x.id) }),
      ),
    beginSession: (s) =>
      mutate(
        (d) => repo.startSession(d, s),
        (prev) => ({ ...prev, sessions: upsert(prev.sessions, s, (x) => x.id) }),
      ),
    removeSession: (id) =>
      mutate(
        (d) => repo.deleteSession(d, id),
        (prev) => ({ ...prev, sessions: prev.sessions.filter((x) => x.id !== id) }),
      ),

    saveBodyWeight: (b) =>
      mutate(
        (d) => repo.putBodyWeight(d, b),
        (prev) => ({ ...prev, bodyweights: upsert(prev.bodyweights, b, (x) => x.id) }),
      ),
    removeBodyWeight: (id) =>
      mutate(
        (d) => repo.deleteBodyWeight(d, id),
        (prev) => ({ ...prev, bodyweights: prev.bodyweights.filter((x) => x.id !== id) }),
      ),

    saveRun: (r) =>
      mutate(
        (d) => repo.putRun(d, r),
        (prev) => ({ ...prev, runs: upsert(prev.runs, r, (x) => x.id) }),
      ),
    removeRun: (id) =>
      mutate(
        (d) => repo.deleteRun(d, id),
        (prev) => ({ ...prev, runs: prev.runs.filter((x) => x.id !== id) }),
      ),

    saveVisit: (v) =>
      mutate(
        (d) => repo.putVisit(d, v),
        (prev) => ({ ...prev, visits: upsert(prev.visits, v, (x) => x.date) }),
      ),
    removeVisit: (date) =>
      mutate(
        (d) => repo.deleteVisit(d, date),
        (prev) => ({ ...prev, visits: prev.visits.filter((x) => x.date !== date) }),
      ),

    saveSettings: (s) =>
      mutate(
        (d) => repo.putSettings(d, s),
        (prev) => ({ ...prev, settings: s }),
      ),

    importData: (incoming) =>
      mutate(
        (d) => repo.replaceAll(d, incoming),
        () => incoming,
      ),
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
