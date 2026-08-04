export type Split = 'push' | 'pull' | 'legs'
export type ISODate = string // 'YYYY-MM-DD', local calendar day
export type ISOTime = string // full ISO-8601 timestamp

export const SPLITS: readonly Split[] = ['push', 'pull', 'legs'] as const
export const SPLIT_LABEL: Record<Split, string> = { push: 'Push', pull: 'Pull', legs: 'Legs' }

/**
 * The mark stamped on a day in the belt strip and the month calendar.
 *
 * Two letters, not one: push and pull both rendered as `P`, which left two of
 * the three splits indistinguishable in the exact two views whose job is
 * telling you which day was which.
 */
export const SPLIT_MARK: Record<Split, string> = { push: 'PS', pull: 'PL', legs: 'LG' }

export interface Exercise {
  id: string
  name: string
  restSeconds: number
  incrementKg: number
  archived: boolean
  createdAt: ISOTime
}

export interface Template {
  split: Split
  exerciseIds: string[]
  updatedAt: ISOTime
}

export interface SetEntry {
  weightKg: number
  reps: number
  done: boolean
}

export interface SessionEntry {
  exerciseId: string
  sets: SetEntry[]
  note?: string
}

export interface Session {
  id: string
  split: Split
  date: ISODate
  startedAt: ISOTime
  finishedAt: ISOTime | null
  entries: SessionEntry[]
  restStartedAt: ISOTime | null
  restSeconds: number | null
}

export interface BodyWeight {
  id: string
  date: ISODate
  kg: number
}

export interface Run {
  id: string
  date: ISODate
  distanceKm: number
  durationSec: number
}

export interface GymVisit {
  date: ISODate
  note?: string
}

export interface Settings {
  unit: 'kg' | 'lb'
  weeklyTarget: number
  restBeepEnabled: boolean
  lastBackupAt: ISOTime | null
}

export const DEFAULT_SETTINGS: Settings = {
  unit: 'kg',
  weeklyTarget: 6,
  restBeepEnabled: true,
  lastBackupAt: null,
}

/** Every record in the app. Shape of the in-memory store and of a backup file. */
export interface FitData {
  exercises: Exercise[]
  templates: Template[]
  sessions: Session[]
  bodyweights: BodyWeight[]
  runs: Run[]
  visits: GymVisit[]
  settings: Settings
}

export const SCHEMA_VERSION = 1
