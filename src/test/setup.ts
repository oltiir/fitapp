import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { webcrypto } from 'node:crypto'

// Each test gets a clean database. The app opens a fixed name ('fitapp') and
// never closes the connection, so deleteDatabase would block — swapping the
// whole factory is the documented reset.
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})

// jsdom's crypto shim has no randomUUID, which every new record id depends on.
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
}

// jsdom logs "not implemented" for confirm(); the app uses it for destructive
// actions, and tests that exercise those want the affirmative path.
globalThis.confirm = () => true
