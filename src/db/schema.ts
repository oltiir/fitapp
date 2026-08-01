import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  BodyWeight,
  Exercise,
  GymVisit,
  ISODate,
  Run,
  Session,
  Split,
  Template,
} from '../types'

export interface FitDb extends DBSchema {
  exercises: { key: string; value: Exercise }
  templates: { key: Split; value: Template }
  sessions: {
    key: string
    value: Session
    indexes: { 'by-date': ISODate; 'by-split-date': [Split, ISODate] }
  }
  bodyweights: { key: string; value: BodyWeight; indexes: { 'by-date': ISODate } }
  runs: { key: string; value: Run; indexes: { 'by-date': ISODate } }
  visits: { key: ISODate; value: GymVisit }
  meta: { key: string; value: unknown }
}

export const DB_NAME = 'fitapp'
export const DB_VERSION = 1

export function openFitDb(name: string = DB_NAME): Promise<IDBPDatabase<FitDb>> {
  return openDB<FitDb>(name, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('exercises', { keyPath: 'id' })
      db.createObjectStore('templates', { keyPath: 'split' })

      const sessions = db.createObjectStore('sessions', { keyPath: 'id' })
      sessions.createIndex('by-date', 'date')
      sessions.createIndex('by-split-date', ['split', 'date'])

      db.createObjectStore('bodyweights', { keyPath: 'id' }).createIndex('by-date', 'date')
      db.createObjectStore('runs', { keyPath: 'id' }).createIndex('by-date', 'date')
      db.createObjectStore('visits', { keyPath: 'date' })
      db.createObjectStore('meta')
    },
  })
}
