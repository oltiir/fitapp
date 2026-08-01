import { buildExport, serializeExport, parseImport, ImportError, backupFilename } from './backup'
import { DEFAULT_SETTINGS, SCHEMA_VERSION, type FitData } from '../types'

const data: FitData = {
  exercises: [
    {
      id: 'bench',
      name: 'Bench Press',
      restSeconds: 180,
      incrementKg: 2.5,
      archived: false,
      createdAt: '2026-08-01T10:00:00.000Z',
    },
  ],
  templates: [{ split: 'push', exerciseIds: ['bench'], updatedAt: '2026-08-01T10:00:00.000Z' }],
  sessions: [
    {
      id: 's1',
      split: 'push',
      date: '2026-08-01',
      startedAt: '2026-08-01T18:00:00.000Z',
      finishedAt: '2026-08-01T19:00:00.000Z',
      entries: [{ exerciseId: 'bench', sets: [{ weightKg: 80, reps: 8, done: true }] }],
      restStartedAt: null,
      restSeconds: null,
    },
  ],
  bodyweights: [{ id: 'b1', date: '2026-08-01', kg: 82.4 }],
  runs: [{ id: 'r1', date: '2026-08-01', distanceKm: 5, durationSec: 1590 }],
  visits: [{ date: '2026-07-30' }],
  settings: DEFAULT_SETTINGS,
}

describe('buildExport', () => {
  it('stamps the schema version and export time', () => {
    const file = buildExport(data, new Date('2026-08-01T18:40:00.000Z'))
    expect(file.schemaVersion).toBe(SCHEMA_VERSION)
    expect(file.exportedAt).toBe('2026-08-01T18:40:00.000Z')
  })
})

describe('export/import round trip', () => {
  it('returns an identical record set', () => {
    const json = serializeExport(data, new Date('2026-08-01T18:40:00.000Z'))
    expect(parseImport(json)).toEqual(data)
  })

  it('preserves nested sets exactly', () => {
    const json = serializeExport(data, new Date('2026-08-01T18:40:00.000Z'))
    expect(parseImport(json).sessions[0]!.entries[0]!.sets[0]).toEqual({
      weightKg: 80,
      reps: 8,
      done: true,
    })
  })

  it('drops the envelope fields, leaving only FitData keys', () => {
    const json = serializeExport(data, new Date('2026-08-01T18:40:00.000Z'))
    expect(Object.keys(parseImport(json)).sort()).toEqual([
      'bodyweights',
      'exercises',
      'runs',
      'sessions',
      'settings',
      'templates',
      'visits',
    ])
  })
})

describe('parseImport validation', () => {
  it('refuses a mismatched schema version rather than guessing', () => {
    const json = JSON.stringify({
      ...data,
      schemaVersion: 99,
      exportedAt: '2026-08-01T00:00:00.000Z',
    })
    expect(() => parseImport(json)).toThrow(ImportError)
    expect(() => parseImport(json)).toThrow(/version/i)
  })

  it('refuses a missing schema version', () => {
    expect(() => parseImport(JSON.stringify(data))).toThrow(ImportError)
  })

  it('refuses malformed JSON', () => {
    expect(() => parseImport('{ not json')).toThrow(ImportError)
  })

  it('refuses a non-object payload', () => {
    expect(() => parseImport('null')).toThrow(ImportError)
    expect(() => parseImport('42')).toThrow(ImportError)
  })

  it('refuses a file missing a required collection', () => {
    const { sessions: _omitted, ...rest } = data
    const json = JSON.stringify({
      ...rest,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-08-01T00:00:00.000Z',
    })
    expect(() => parseImport(json)).toThrow(/sessions/)
  })

  it('refuses a file with no settings', () => {
    const { settings: _omitted, ...rest } = data
    const json = JSON.stringify({
      ...rest,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-08-01T00:00:00.000Z',
    })
    expect(() => parseImport(json)).toThrow(/settings/)
  })

  it('fills in missing settings keys from defaults', () => {
    const json = JSON.stringify({
      ...data,
      settings: { unit: 'lb' },
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-08-01T00:00:00.000Z',
    })
    const parsed = parseImport(json)
    expect(parsed.settings.unit).toBe('lb')
    expect(parsed.settings.weeklyTarget).toBe(DEFAULT_SETTINGS.weeklyTarget)
  })
})

describe('backupFilename', () => {
  it('embeds the local date', () => {
    expect(backupFilename(new Date(2026, 7, 1, 18, 40))).toBe('fitapp-backup-2026-08-01.json')
  })
})
