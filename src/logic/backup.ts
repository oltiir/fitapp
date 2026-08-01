import { DEFAULT_SETTINGS, SCHEMA_VERSION, type FitData, type ISOTime, type Settings } from '../types'
import { toISODate } from './dates'

export interface BackupFile extends FitData {
  schemaVersion: number
  exportedAt: ISOTime
}

export class ImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImportError'
  }
}

const COLLECTIONS = ['exercises', 'templates', 'sessions', 'bodyweights', 'runs', 'visits'] as const

export function buildExport(data: FitData, now: Date): BackupFile {
  return { schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), ...data }
}

export function serializeExport(data: FitData, now: Date): string {
  return JSON.stringify(buildExport(data, now), null, 2)
}

export function backupFilename(now: Date): string {
  return `fitapp-backup-${toISODate(now)}.json`
}

/** Strict: a mismatched or missing version is refused, never coerced. */
export function parseImport(json: string): FitData {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new ImportError('That file is not valid JSON.')
  }
  if (typeof raw !== 'object' || raw === null) throw new ImportError('That file is not a backup.')

  const obj = raw as Record<string, unknown>

  if (obj.schemaVersion !== SCHEMA_VERSION) {
    throw new ImportError(
      `Unsupported backup version ${String(obj.schemaVersion)}; this app reads version ${SCHEMA_VERSION}.`,
    )
  }

  for (const key of COLLECTIONS) {
    if (!Array.isArray(obj[key])) throw new ImportError(`Backup is missing its "${key}" list.`)
  }
  if (typeof obj.settings !== 'object' || obj.settings === null) {
    throw new ImportError('Backup is missing its "settings".')
  }

  return {
    exercises: obj.exercises as FitData['exercises'],
    templates: obj.templates as FitData['templates'],
    sessions: obj.sessions as FitData['sessions'],
    bodyweights: obj.bodyweights as FitData['bodyweights'],
    runs: obj.runs as FitData['runs'],
    visits: obj.visits as FitData['visits'],
    settings: { ...DEFAULT_SETTINGS, ...(obj.settings as Partial<Settings>) },
  }
}
