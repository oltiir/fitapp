# PPL Gym Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first Push/Pull/Legs training log as an installable iPhone PWA, per `docs/superpowers/specs/2026-08-01-ppl-gym-tracker-design.md`.

**Architecture:** Three layers with strict boundaries. `src/db/` owns IndexedDB and knows only record shapes. `src/logic/` is pure functions over records — no I/O, no React — and is where every test lives. `src/screens/` and `src/components/` render and collect input, holding no domain rules. All data loads into one in-memory store at startup (a React context); mutations write through to IndexedDB and update the store. A dataset of a few hundred sessions makes any lazier strategy pointless complexity.

**Tech Stack:** Vite, React 19, TypeScript, `idb`, `vite-plugin-pwa`, Vitest + `fake-indexeddb`. No UI library. No chart library — charts are hand-rolled SVG.

## Global Constraints

- **All weights are stored in kilograms, always.** `Settings.unit` is display-only; conversion happens at the render and input boundary. Every stored weight field carries a `Kg` suffix.
- **Dates:** `ISODate` is `'YYYY-MM-DD'` in the **local** calendar. Never `new Date('2026-08-01')` — that parses as UTC and shifts the day. Always construct with `new Date(y, m - 1, d)`.
- **`daysAgo` / `daysSince` count whole local calendar days**, not 24-hour spans.
- **Every logic function that needs the current time takes `now` as an explicit parameter.** No `Date.now()` inside `src/logic/`.
- **Week starts Monday**, 00:00 local.
- **At most one `Session` with `finishedAt === null`.** Enforced in the repository.
- **Exercises are archived, never deleted.**
- **Rest-timer remaining is always derived from a stored timestamp**, never by decrementing a counter.
- **Inputs use `font-size: 16px` minimum** — below that iOS zooms the viewport on focus.
- **Dark theme only.** Tap targets ≥ 44 px.
- Tests are colocated: `src/logic/sets.ts` → `src/logic/sets.test.ts`.
- Commit after every task. Conventional commit prefixes (`feat:`, `test:`, `chore:`).

## File Structure

| Path | Responsibility |
|---|---|
| `src/types.ts` | Every shared interface and type. No logic. |
| `src/db/schema.ts` | `openFitDb()`, store and index definitions, migrations. |
| `src/db/repo.ts` | Typed CRUD. Enforces the single-active-session invariant. |
| `src/logic/dates.ts` | `todayISO`, `toISODate`, `parseISODate`, `daysBetween`, `weekBounds`. |
| `src/logic/units.ts` | kg ↔ lb display conversion and formatting. |
| `src/logic/sets.ts` | `e1rm`, `sessionVolume`, `topSetKg`, `prefillSets`. |
| `src/logic/history.ts` | `lastPerformance`, `personalRecord`. |
| `src/logic/attendance.ts` | `nextSplit`, `attendedToday`, `weekAttendance`, `daysSince`. |
| `src/logic/bodyweight.ts` | `rollingAverage`. |
| `src/logic/rest.ts` | `restRemaining`. |
| `src/logic/backup.ts` | `buildExport`, `parseImport`. |
| `src/logic/seed.ts` | Default exercises and templates. |
| `src/store/StoreContext.tsx` | In-memory store, loader, mutators. |
| `src/hooks/useTicker.ts` | 250 ms re-render tick for the rest bar. |
| `src/hooks/useWakeLock.ts` | Screen Wake Lock during an active session. |
| `src/components/TabBar.tsx` | Bottom nav, safe-area aware. |
| `src/components/Stepper.tsx` | `− value +` control with direct-edit keypad. |
| `src/components/RestBar.tsx` | Pinned rest timer bar with beep. |
| `src/components/LineChart.tsx` | Generic SVG line/scatter chart. |
| `src/screens/TodayScreen.tsx` | Attendance card, week ring, days-since, quick-adds. |
| `src/screens/SessionScreen.tsx` | Active workout logging. |
| `src/screens/ProgressScreen.tsx` | Recap / Exercise / PRs / Calendar. |
| `src/screens/BodyScreen.tsx` | Bodyweight chart, runs. |
| `src/screens/SettingsScreen.tsx` | Templates, exercises, backup, preferences. |
| `src/styles.css` | Dark tokens, layout primitives, iOS resets. |

---

### Task 1: Scaffold and tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/vite-env.d.ts`
- Create: `src/logic/smoke.test.ts` (deleted at end of task — proves the runner works)

**Interfaces:**
- Consumes: nothing
- Produces: `npm test`, `npm run dev`, `npm run build`, `npm run typecheck` all working

- [ ] **Step 1: Create the Vite project files**

`package.json`:
```json
{
  "name": "fitapp",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc -b --noEmit"
  },
  "dependencies": {
    "idb": "^8.0.3",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.0.4",
    "fake-indexeddb": "^6.2.2",
    "typescript": "^5.9.3",
    "vite": "^7.1.12",
    "vite-plugin-pwa": "^1.0.3",
    "vitest": "^3.2.4"
  }
}
```

`tsconfig.json`:
```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

`tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src"]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

`vite.config.ts` (PWA plugin is added in Task 12; keep it minimal now):
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" />
    <meta name="theme-color" content="#0b0d10" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="FitApp" />
    <title>FitApp</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/App.tsx`:
```tsx
export default function App() {
  return <div className="app">FitApp</div>
}
```

`src/styles.css` — the iOS-critical resets; full design tokens land in Task 9:
```css
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body, #root { height: 100%; margin: 0; }
body {
  background: #0b0d10;
  color: #e7ecf3;
  font: 16px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  overscroll-behavior: none;
  touch-action: manipulation;
}
button { font: inherit; color: inherit; touch-action: manipulation; user-select: none; -webkit-user-select: none; }
input { font-size: 16px; }
```

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: no errors; `node_modules/` created.

- [ ] **Step 3: Write a smoke test to prove the runner works**

`src/logic/smoke.test.ts`:
```ts
describe('vitest', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 4: Run the test suite**

Run: `npm test`
Expected: PASS, 1 test.

- [ ] **Step 5: Verify typecheck and build**

Run: `npm run typecheck && npm run build`
Expected: both succeed; `dist/` created.

- [ ] **Step 6: Delete the smoke test and commit**

```bash
rm src/logic/smoke.test.ts
git add -A
git commit -m "chore: scaffold Vite + React + TS with Vitest"
```

---

### Task 2: Types and date logic

**Files:**
- Create: `src/types.ts`, `src/logic/dates.ts`, `src/logic/dates.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type Split = 'push' | 'pull' | 'legs'`, `ISODate`, `ISOTime`
  - `Exercise`, `Template`, `SetEntry`, `SessionEntry`, `Session`, `BodyWeight`, `Run`, `GymVisit`, `Settings`, `FitData`
  - `SPLITS: readonly Split[]`, `SPLIT_LABEL: Record<Split, string>`
  - `toISODate(d: Date): ISODate`
  - `parseISODate(s: ISODate): Date` — local midnight
  - `todayISO(now: Date): ISODate`
  - `daysBetween(from: ISODate, to: ISODate): number` — whole calendar days, may be negative
  - `weekBounds(now: Date): { start: ISODate; end: ISODate }` — Monday..Sunday
  - `datesInRange(start: ISODate, end: ISODate): ISODate[]`

- [ ] **Step 1: Write `src/types.ts`**

```ts
export type Split = 'push' | 'pull' | 'legs'
export type ISODate = string // 'YYYY-MM-DD', local calendar day
export type ISOTime = string // full ISO-8601 timestamp

export const SPLITS: readonly Split[] = ['push', 'pull', 'legs'] as const
export const SPLIT_LABEL: Record<Split, string> = { push: 'Push', pull: 'Pull', legs: 'Legs' }

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
```

- [ ] **Step 2: Write the failing tests**

`src/logic/dates.test.ts`:
```ts
import { toISODate, parseISODate, todayISO, daysBetween, weekBounds, datesInRange } from './dates'

describe('toISODate', () => {
  it('formats local calendar parts, not UTC', () => {
    // 00:30 local on 1 Aug — UTC-shifting would yield 31 Jul in positive offsets
    expect(toISODate(new Date(2026, 7, 1, 0, 30))).toBe('2026-08-01')
  })

  it('zero-pads month and day', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('parseISODate', () => {
  it('returns local midnight', () => {
    const d = parseISODate('2026-08-01')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(7)
    expect(d.getDate()).toBe(1)
    expect(d.getHours()).toBe(0)
  })

  it('round-trips with toISODate', () => {
    expect(toISODate(parseISODate('2026-02-29'))).toBe('2026-03-01') // 2026 is not a leap year
    expect(toISODate(parseISODate('2026-12-31'))).toBe('2026-12-31')
  })
})

describe('todayISO', () => {
  it('uses the injected clock', () => {
    expect(todayISO(new Date(2026, 6, 4, 23, 59))).toBe('2026-07-04')
  })
})

describe('daysBetween', () => {
  it('counts whole calendar days', () => {
    expect(daysBetween('2026-07-27', '2026-08-01')).toBe(5)
  })

  it('counts a late-night session as 1 day ago the next morning', () => {
    expect(daysBetween('2026-07-31', '2026-08-01')).toBe(1)
  })

  it('is 0 for the same day', () => {
    expect(daysBetween('2026-08-01', '2026-08-01')).toBe(0)
  })

  it('goes negative for future dates', () => {
    expect(daysBetween('2026-08-03', '2026-08-01')).toBe(-2)
  })

  it('crosses a DST boundary without drifting', () => {
    // EU DST ends 25 Oct 2026; a naive ms/86400000 division rounds wrong here
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
  })
})

describe('weekBounds', () => {
  it('starts Monday and ends Sunday', () => {
    // 2026-08-01 is a Saturday
    expect(weekBounds(new Date(2026, 7, 1, 12))).toEqual({ start: '2026-07-27', end: '2026-08-02' })
  })

  it('treats Sunday as the end of the week, not the start', () => {
    expect(weekBounds(new Date(2026, 7, 2, 12))).toEqual({ start: '2026-07-27', end: '2026-08-02' })
  })

  it('treats Monday as its own week start', () => {
    expect(weekBounds(new Date(2026, 7, 3, 0, 1))).toEqual({ start: '2026-08-03', end: '2026-08-09' })
  })

  it('spans a month boundary', () => {
    expect(weekBounds(new Date(2026, 6, 30, 12))).toEqual({ start: '2026-07-27', end: '2026-08-02' })
  })
})

describe('datesInRange', () => {
  it('is inclusive on both ends', () => {
    expect(datesInRange('2026-07-31', '2026-08-02')).toEqual(['2026-07-31', '2026-08-01', '2026-08-02'])
  })

  it('returns a single date when start equals end', () => {
    expect(datesInRange('2026-08-01', '2026-08-01')).toEqual(['2026-08-01'])
  })
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test -- dates`
Expected: FAIL — cannot resolve `./dates`.

- [ ] **Step 4: Implement `src/logic/dates.ts`**

```ts
import type { ISODate } from '../types'

const MS_PER_DAY = 86_400_000

export function toISODate(d: Date): ISODate {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parses as LOCAL midnight. `new Date('2026-08-01')` would parse as UTC and shift the day. */
export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}

export function todayISO(now: Date): ISODate {
  return toISODate(now)
}

/**
 * Whole local calendar days from `from` to `to`. Negative when `to` precedes `from`.
 * Both endpoints are normalised to UTC midnight before subtracting, so DST
 * transitions (a 23- or 25-hour local day) cannot skew the result.
 */
export function daysBetween(from: ISODate, to: ISODate): number {
  const a = parseISODate(from)
  const b = parseISODate(to)
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utcB - utcA) / MS_PER_DAY)
}

/** Monday-start week containing `now`. */
export function weekBounds(now: Date): { start: ISODate; end: ISODate } {
  const dow = now.getDay() // 0 = Sunday
  const backToMonday = (dow + 6) % 7
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - backToMonday)
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
  return { start: toISODate(start), end: toISODate(end) }
}

export function datesInRange(start: ISODate, end: ISODate): ISODate[] {
  const out: ISODate[] = []
  const cursor = parseISODate(start)
  const last = parseISODate(end)
  while (cursor <= last) {
    out.push(toISODate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npm test -- dates`
Expected: PASS, all cases.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/logic/dates.ts src/logic/dates.test.ts
git commit -m "feat: add shared types and local-calendar date helpers"
```

---

### Task 3: Set math

**Files:**
- Create: `src/logic/sets.ts`, `src/logic/sets.test.ts`

**Interfaces:**
- Consumes: `Session`, `SetEntry`, `SessionEntry` from `src/types.ts`
- Produces:
  - `e1rm(weightKg: number, reps: number): number` — throws on `reps < 1`
  - `sessionVolume(session: Session): number`
  - `topSetKg(session: Session, exerciseId: string): number | null`
  - `prefillSets(sets: SetEntry[]): SetEntry[]`
  - `emptySet(): SetEntry`
  - `entryFor(session: Session, exerciseId: string): SessionEntry | undefined`

- [ ] **Step 1: Write the failing tests**

`src/logic/sets.test.ts`:
```ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- sets`
Expected: FAIL — cannot resolve `./sets`.

- [ ] **Step 3: Implement `src/logic/sets.ts`**

```ts
import type { Session, SessionEntry, SetEntry } from '../types'

export function emptySet(): SetEntry {
  return { weightKg: 0, reps: 0, done: false }
}

/** Epley estimated 1RM. Comparable across rep ranges, which is what makes PRs meaningful. */
export function e1rm(weightKg: number, reps: number): number {
  if (reps < 1) throw new Error(`e1rm requires reps >= 1, got ${reps}`)
  return weightKg * (1 + reps / 30)
}

export function entryFor(session: Session, exerciseId: string): SessionEntry | undefined {
  return session.entries.find((e) => e.exerciseId === exerciseId)
}

export function sessionVolume(session: Session): number {
  let total = 0
  for (const entry of session.entries) {
    for (const s of entry.sets) {
      if (s.done) total += s.weightKg * s.reps
    }
  }
  return total
}

/** Heaviest done set for one exercise in one session. This is what the exercise chart plots. */
export function topSetKg(session: Session, exerciseId: string): number | null {
  const done = entryFor(session, exerciseId)?.sets.filter((s) => s.done) ?? []
  if (done.length === 0) return null
  return Math.max(...done.map((s) => s.weightKg))
}

/**
 * Last time's sets, ready to be worked through again. Deliberately does NOT
 * increment: the app shows what happened and the lifter decides the jump.
 */
export function prefillSets(sets: SetEntry[]): SetEntry[] {
  if (sets.length === 0) return [emptySet()]
  return sets.map((s) => ({ weightKg: s.weightKg, reps: s.reps, done: false }))
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- sets`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/logic/sets.ts src/logic/sets.test.ts
git commit -m "feat: add set math (e1rm, volume, top set, prefill)"
```

---

### Task 4: History and personal records

**Files:**
- Create: `src/logic/history.ts`, `src/logic/history.test.ts`

**Interfaces:**
- Consumes: `Session`, `SetEntry`, `ISODate` from types; `daysBetween` from `./dates`; `e1rm`, `entryFor` from `./sets`
- Produces:
  - `interface LastPerformance { date: ISODate; daysAgo: number; sets: SetEntry[] }`
  - `lastPerformance(sessions: Session[], exerciseId: string, today: ISODate): LastPerformance | null`
  - `interface PersonalRecord { weightKg: number; reps: number; date: ISODate; e1rm: number }`
  - `personalRecord(sessions: Session[], exerciseId: string): PersonalRecord | null`
  - `finishedSessions(sessions: Session[]): Session[]` — finished only, newest first
  - `activeSession(sessions: Session[]): Session | undefined`

- [ ] **Step 1: Write the failing tests**

`src/logic/history.test.ts`:
```ts
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

  it('returns only that exercise‘s sets, not the whole session', () => {
    const sessions = [
      session('2026-07-27', [
        { exerciseId: 'bench', sets: [set(80, 8)] },
        { exerciseId: 'row', sets: [set(60, 10), set(60, 10)] },
      ]),
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
    // 60x10 and 80x0.. use two sets with equal e1rm: 30x30 vs 60x15 → 60 and 90; craft exact tie:
    // e1rm(90, 10) = 120, e1rm(120, 0) invalid. Use 100x6 = 120 and 60x30 = 120.
    const sessions = [
      session('2026-07-20', [{ exerciseId: 'bench', sets: [set(60, 30)] }]),
      session('2026-07-27', [{ exerciseId: 'bench', sets: [set(100, 6)] }]),
    ]
    const pr = personalRecord(sessions, 'bench')
    expect(pr!.e1rm).toBeCloseTo(120, 6)
    expect(pr!.weightKg).toBe(100)
  })

  it('ignores undone sets', () => {
    const sessions = [session('2026-07-27', [{ exerciseId: 'bench', sets: [set(80, 8), set(200, 1, false)] }])]
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- history`
Expected: FAIL — cannot resolve `./history`.

- [ ] **Step 3: Implement `src/logic/history.ts`**

```ts
import type { ISODate, Session, SetEntry } from '../types'
import { daysBetween } from './dates'
import { e1rm, entryFor } from './sets'

export interface LastPerformance {
  date: ISODate
  daysAgo: number
  sets: SetEntry[]
}

export interface PersonalRecord {
  weightKg: number
  reps: number
  date: ISODate
  e1rm: number
}

/** Finished sessions only, newest first. The active session is never history. */
export function finishedSessions(sessions: Session[]): Session[] {
  return sessions
    .filter((s) => s.finishedAt !== null)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.startedAt.localeCompare(a.startedAt)))
}

export function activeSession(sessions: Session[]): Session | undefined {
  return sessions.find((s) => s.finishedAt === null)
}

/**
 * The last time this exercise was actually performed — keyed on the exercise, not
 * the split, so moving an exercise between templates preserves its history.
 */
export function lastPerformance(
  sessions: Session[],
  exerciseId: string,
  today: ISODate,
): LastPerformance | null {
  for (const session of finishedSessions(sessions)) {
    const done = entryFor(session, exerciseId)?.sets.filter((s) => s.done) ?? []
    if (done.length === 0) continue
    return { date: session.date, daysAgo: daysBetween(session.date, today), sets: done }
  }
  return null
}

/** Best estimated 1RM ever recorded, reported as the real set that produced it. */
export function personalRecord(sessions: Session[], exerciseId: string): PersonalRecord | null {
  let best: PersonalRecord | null = null
  for (const session of finishedSessions(sessions)) {
    for (const s of entryFor(session, exerciseId)?.sets ?? []) {
      if (!s.done || s.reps < 1) continue
      const score = e1rm(s.weightKg, s.reps)
      const better =
        best === null || score > best.e1rm || (score === best.e1rm && s.weightKg > best.weightKg)
      if (better) best = { weightKg: s.weightKg, reps: s.reps, date: session.date, e1rm: score }
    }
  }
  return best
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- history`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/logic/history.ts src/logic/history.test.ts
git commit -m "feat: add last-performance lookup and personal records"
```

---

### Task 5: Attendance and rotation

**Files:**
- Create: `src/logic/attendance.ts`, `src/logic/attendance.test.ts`

**Interfaces:**
- Consumes: `Session`, `GymVisit`, `Split`, `SPLITS`; `daysBetween`, `todayISO`, `weekBounds` from `./dates`; `finishedSessions` from `./history`
- Produces:
  - `nextSplit(sessions: Session[]): Split`
  - `attendedDates(sessions: Session[], visits: GymVisit[]): Set<ISODate>`
  - `attendedToday(sessions: Session[], visits: GymVisit[], now: Date): boolean`
  - `interface WeekAttendance { dates: ISODate[]; count: number; splitsByDate: Record<ISODate, Split[]> }`
  - `weekAttendance(sessions, visits, now): WeekAttendance`
  - `daysSince(sessions: Session[], split: Split, today: ISODate): number | null`
  - `daysSinceAll(sessions, today): Record<Split, number | null>`
  - `STALE_SPLIT_DAYS = 7`

- [ ] **Step 1: Write the failing tests**

`src/logic/attendance.test.ts`:
```ts
import {
  nextSplit,
  attendedDates,
  attendedToday,
  weekAttendance,
  daysSince,
  daysSinceAll,
  STALE_SPLIT_DAYS,
} from './attendance'
import type { Session, Split } from '../types'

let counter = 0
const session = (date: string, split: Split, active = false): Session => ({
  id: `s${++counter}`,
  split,
  date,
  startedAt: `${date}T18:00:00.000Z`,
  finishedAt: active ? null : `${date}T19:00:00.000Z`,
  entries: [],
  restStartedAt: null,
  restSeconds: null,
})

describe('nextSplit', () => {
  it('starts at push with no history', () => {
    expect(nextSplit([])).toBe('push')
  })

  it('advances push to pull', () => {
    expect(nextSplit([session('2026-07-30', 'push')])).toBe('pull')
  })

  it('advances pull to legs', () => {
    expect(nextSplit([session('2026-07-30', 'pull')])).toBe('legs')
  })

  it('wraps legs back to push', () => {
    expect(nextSplit([session('2026-07-30', 'legs')])).toBe('push')
  })

  it('follows a repeated split without correcting it', () => {
    const sessions = [session('2026-07-28', 'push'), session('2026-07-30', 'push')]
    expect(nextSplit(sessions)).toBe('pull')
  })

  it('ignores the active session so starting a workout does not advance the suggestion', () => {
    const sessions = [session('2026-07-30', 'push'), session('2026-08-01', 'legs', true)]
    expect(nextSplit(sessions)).toBe('pull')
  })
})

describe('attendedDates', () => {
  it('includes finished sessions and manual visits', () => {
    const dates = attendedDates([session('2026-07-30', 'push')], [{ date: '2026-07-31' }])
    expect([...dates].sort()).toEqual(['2026-07-30', '2026-07-31'])
  })

  it('counts a session and a visit on the same day once', () => {
    const dates = attendedDates([session('2026-07-30', 'push')], [{ date: '2026-07-30' }])
    expect(dates.size).toBe(1)
  })

  it('excludes the active session — attendance requires finishing or a manual mark', () => {
    expect(attendedDates([session('2026-08-01', 'push', true)], []).size).toBe(0)
  })
})

describe('attendedToday', () => {
  const now = new Date(2026, 7, 1, 20)

  it('is true from a finished session today', () => {
    expect(attendedToday([session('2026-08-01', 'push')], [], now)).toBe(true)
  })

  it('is true from a manual visit today', () => {
    expect(attendedToday([], [{ date: '2026-08-01' }], now)).toBe(true)
  })

  it('is false from an active session alone', () => {
    expect(attendedToday([session('2026-08-01', 'push', true)], [], now)).toBe(false)
  })

  it('is false when nothing happened today', () => {
    expect(attendedToday([session('2026-07-31', 'push')], [], now)).toBe(false)
  })
})

describe('weekAttendance', () => {
  const now = new Date(2026, 7, 1, 12) // Saturday; week is 2026-07-27..2026-08-02

  it('counts only days inside the Monday-start week', () => {
    const sessions = [
      session('2026-07-26', 'push'), // previous week
      session('2026-07-27', 'push'),
      session('2026-07-29', 'pull'),
      session('2026-08-01', 'legs'),
    ]
    const result = weekAttendance(sessions, [], now)
    expect(result.count).toBe(3)
    expect(result.dates).toEqual(['2026-07-27', '2026-07-29', '2026-08-01'])
  })

  it('includes manual visits in the count', () => {
    const result = weekAttendance([session('2026-07-27', 'push')], [{ date: '2026-07-28' }], now)
    expect(result.count).toBe(2)
  })

  it('maps splits per date and leaves manual visits with no split', () => {
    const result = weekAttendance([session('2026-07-27', 'push')], [{ date: '2026-07-28' }], now)
    expect(result.splitsByDate['2026-07-27']).toEqual(['push'])
    expect(result.splitsByDate['2026-07-28']).toBeUndefined()
  })

  it('records two splits when a day holds two sessions', () => {
    const sessions = [session('2026-07-27', 'push'), session('2026-07-27', 'pull')]
    expect(weekAttendance(sessions, [], now).splitsByDate['2026-07-27']).toEqual(['push', 'pull'])
    expect(weekAttendance(sessions, [], now).count).toBe(1) // one attended DAY
  })

  it('is 0 for an empty history', () => {
    expect(weekAttendance([], [], now).count).toBe(0)
  })
})

describe('daysSince', () => {
  it('counts calendar days since the last session of that split', () => {
    expect(daysSince([session('2026-07-30', 'push')], 'push', '2026-08-01')).toBe(2)
  })

  it('returns null when the split has never been trained', () => {
    expect(daysSince([session('2026-07-30', 'push')], 'legs', '2026-08-01')).toBeNull()
  })

  it('returns 0 for a session today', () => {
    expect(daysSince([session('2026-08-01', 'push')], 'push', '2026-08-01')).toBe(0)
  })

  it('marks exactly 7 days as not yet stale', () => {
    expect(daysSince([session('2026-07-25', 'legs')], 'legs', '2026-08-01')).toBe(7)
    expect(7 > STALE_SPLIT_DAYS).toBe(false)
  })

  it('marks 8 days as stale', () => {
    expect(daysSince([session('2026-07-24', 'legs')], 'legs', '2026-08-01')! > STALE_SPLIT_DAYS).toBe(true)
  })

  it('ignores the active session', () => {
    expect(daysSince([session('2026-08-01', 'push', true)], 'push', '2026-08-01')).toBeNull()
  })
})

describe('daysSinceAll', () => {
  it('reports every split', () => {
    const sessions = [session('2026-07-30', 'push'), session('2026-07-27', 'pull')]
    expect(daysSinceAll(sessions, '2026-08-01')).toEqual({ push: 2, pull: 5, legs: null })
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- attendance`
Expected: FAIL — cannot resolve `./attendance`.

- [ ] **Step 3: Implement `src/logic/attendance.ts`**

```ts
import { SPLITS, type GymVisit, type ISODate, type Session, type Split } from '../types'
import { daysBetween, todayISO, weekBounds } from './dates'
import { finishedSessions } from './history'

export const STALE_SPLIT_DAYS = 7

/** Advances the rotation from the last finished session. Follows reality; never scolds. */
export function nextSplit(sessions: Session[]): Split {
  const last = finishedSessions(sessions)[0]
  if (!last) return 'push'
  const i = SPLITS.indexOf(last.split)
  return SPLITS[(i + 1) % SPLITS.length]!
}

/** A day is attended if a session was finished on it, or it was marked manually. */
export function attendedDates(sessions: Session[], visits: GymVisit[]): Set<ISODate> {
  const dates = new Set<ISODate>()
  for (const s of finishedSessions(sessions)) dates.add(s.date)
  for (const v of visits) dates.add(v.date)
  return dates
}

export function attendedToday(sessions: Session[], visits: GymVisit[], now: Date): boolean {
  return attendedDates(sessions, visits).has(todayISO(now))
}

export interface WeekAttendance {
  dates: ISODate[]
  count: number
  splitsByDate: Record<ISODate, Split[]>
}

export function weekAttendance(sessions: Session[], visits: GymVisit[], now: Date): WeekAttendance {
  const { start, end } = weekBounds(now)
  const inWeek = (d: ISODate) => d >= start && d <= end

  const dates = [...attendedDates(sessions, visits)].filter(inWeek).sort()

  const splitsByDate: Record<ISODate, Split[]> = {}
  for (const s of finishedSessions(sessions).filter((s) => inWeek(s.date))) {
    ;(splitsByDate[s.date] ??= []).unshift(s.split) // finishedSessions is newest-first
  }

  return { dates, count: dates.length, splitsByDate }
}

export function daysSince(sessions: Session[], split: Split, today: ISODate): number | null {
  const last = finishedSessions(sessions).find((s) => s.split === split)
  return last ? daysBetween(last.date, today) : null
}

export function daysSinceAll(sessions: Session[], today: ISODate): Record<Split, number | null> {
  return {
    push: daysSince(sessions, 'push', today),
    pull: daysSince(sessions, 'pull', today),
    legs: daysSince(sessions, 'legs', today),
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- attendance`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/logic/attendance.ts src/logic/attendance.test.ts
git commit -m "feat: add attendance, weekly count and split rotation"
```

---

### Task 6: Bodyweight trend, units, rest timer, run pace

**Files:**
- Create: `src/logic/bodyweight.ts`, `src/logic/bodyweight.test.ts`, `src/logic/units.ts`, `src/logic/units.test.ts`, `src/logic/rest.ts`, `src/logic/rest.test.ts`

**Interfaces:**
- Consumes: `BodyWeight`, `Run`, `Settings`, `ISOTime`; `daysBetween` from `./dates`
- Produces:
  - `interface TrendPoint { date: ISODate; kg: number; avgKg: number }`
  - `rollingAverage(entries: BodyWeight[], windowDays: number): TrendPoint[]`
  - `weightChange(entries: BodyWeight[], overDays: number, today: ISODate): number | null`
  - `KG_PER_LB = 0.45359237`
  - `toDisplayWeight(kg, unit): number`, `fromDisplayWeight(value, unit): number`
  - `formatWeight(kg, unit): string`
  - `paceSecPerKm(run: Run): number | null`, `formatPace(secPerKm): string`, `formatDuration(sec): string`
  - `restRemaining(restStartedAt: ISOTime | null, restSeconds: number | null, now: Date): number | null`

- [ ] **Step 1: Write the failing tests**

`src/logic/bodyweight.test.ts`:
```ts
import { rollingAverage, weightChange } from './bodyweight'
import type { BodyWeight } from '../types'

const bw = (date: string, kg: number): BodyWeight => ({ id: date, date, kg })

describe('rollingAverage', () => {
  it('averages over a trailing inclusive window', () => {
    const points = rollingAverage([bw('2026-08-01', 82), bw('2026-08-02', 84)], 7)
    expect(points[0]!.avgKg).toBeCloseTo(82)
    expect(points[1]!.avgKg).toBeCloseTo(83)
  })

  it('excludes entries older than the window', () => {
    // 8 days apart: the first entry falls outside a 7-day trailing window
    const points = rollingAverage([bw('2026-07-24', 90), bw('2026-08-01', 80)], 7)
    expect(points[1]!.avgKg).toBeCloseTo(80)
  })

  it('includes an entry exactly at the window edge', () => {
    const points = rollingAverage([bw('2026-07-26', 90), bw('2026-08-01', 80)], 7)
    expect(points[1]!.avgKg).toBeCloseTo(85)
  })

  it('sorts unordered input by date', () => {
    const points = rollingAverage([bw('2026-08-02', 84), bw('2026-08-01', 82)], 7)
    expect(points.map((p) => p.date)).toEqual(['2026-08-01', '2026-08-02'])
  })

  it('returns the raw value as its own average for a single entry', () => {
    expect(rollingAverage([bw('2026-08-01', 82.4)], 7)).toEqual([
      { date: '2026-08-01', kg: 82.4, avgKg: 82.4 },
    ])
  })

  it('returns an empty array for no entries', () => {
    expect(rollingAverage([], 7)).toEqual([])
  })

  it('averages several entries on the same day', () => {
    const points = rollingAverage([bw('2026-08-01', 82), { id: 'x', date: '2026-08-01', kg: 84 }], 7)
    expect(points[1]!.avgKg).toBeCloseTo(83)
  })
})

describe('weightChange', () => {
  it('compares the latest average against the average four weeks earlier', () => {
    const entries = [bw('2026-07-04', 84), bw('2026-08-01', 82)]
    expect(weightChange(entries, 28, '2026-08-01')).toBeCloseTo(-2)
  })

  it('returns null without an entry old enough to compare', () => {
    expect(weightChange([bw('2026-08-01', 82)], 28, '2026-08-01')).toBeNull()
  })

  it('returns null for no entries', () => {
    expect(weightChange([], 28, '2026-08-01')).toBeNull()
  })
})
```

`src/logic/units.test.ts`:
```ts
import {
  toDisplayWeight,
  fromDisplayWeight,
  formatWeight,
  paceSecPerKm,
  formatPace,
  formatDuration,
} from './units'
import type { Run } from '../types'

describe('weight conversion', () => {
  it('is identity in kg', () => {
    expect(toDisplayWeight(82.5, 'kg')).toBe(82.5)
    expect(fromDisplayWeight(82.5, 'kg')).toBe(82.5)
  })

  it('converts kg to lb', () => {
    expect(toDisplayWeight(100, 'lb')).toBeCloseTo(220.462, 3)
  })

  it('round-trips lb through storage without drift', () => {
    const stored = fromDisplayWeight(225, 'lb')
    expect(toDisplayWeight(stored, 'lb')).toBeCloseTo(225, 6)
  })

  it('formats without trailing zeros', () => {
    expect(formatWeight(80, 'kg')).toBe('80 kg')
    expect(formatWeight(82.5, 'kg')).toBe('82.5 kg')
  })
})

describe('pace', () => {
  const run = (distanceKm: number, durationSec: number): Run => ({
    id: 'r1',
    date: '2026-08-01',
    distanceKm,
    durationSec,
  })

  it('computes seconds per kilometre', () => {
    expect(paceSecPerKm(run(5, 1590))).toBe(318)
  })

  it('returns null for zero distance rather than dividing by zero', () => {
    expect(paceSecPerKm(run(0, 600))).toBeNull()
  })

  it('formats pace as m:ss', () => {
    expect(formatPace(318)).toBe('5:18')
    expect(formatPace(305)).toBe('5:05')
  })

  it('formats duration under an hour as m:ss', () => {
    expect(formatDuration(1590)).toBe('26:30')
  })

  it('formats duration over an hour as h:mm:ss', () => {
    expect(formatDuration(3725)).toBe('1:02:05')
  })
})
```

`src/logic/rest.test.ts`:
```ts
import { restRemaining } from './rest'

describe('restRemaining', () => {
  const started = '2026-08-01T18:00:00.000Z'

  it('returns null when no timer is running', () => {
    expect(restRemaining(null, null, new Date('2026-08-01T18:00:00.000Z'))).toBeNull()
    expect(restRemaining(started, null, new Date('2026-08-01T18:00:00.000Z'))).toBeNull()
  })

  it('returns the full duration at the moment it starts', () => {
    expect(restRemaining(started, 180, new Date('2026-08-01T18:00:00.000Z'))).toBe(180)
  })

  it('counts down from the stored timestamp', () => {
    expect(restRemaining(started, 180, new Date('2026-08-01T18:00:13.000Z'))).toBe(167)
  })

  it('clamps at zero instead of going negative', () => {
    expect(restRemaining(started, 180, new Date('2026-08-01T18:10:00.000Z'))).toBe(0)
  })

  it('is correct after a long background gap, which a decrementing counter would not be', () => {
    // Phone pocketed for 4 minutes on a 3-minute rest
    expect(restRemaining(started, 180, new Date('2026-08-01T18:04:00.000Z'))).toBe(0)
  })

  it('rounds up so 0 only appears when the timer is genuinely done', () => {
    expect(restRemaining(started, 180, new Date('2026-08-01T18:02:59.500Z'))).toBe(1)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- bodyweight units rest`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the three modules**

`src/logic/bodyweight.ts`:
```ts
import type { BodyWeight, ISODate } from '../types'
import { daysBetween } from './dates'

export interface TrendPoint {
  date: ISODate
  kg: number
  avgKg: number
}

function byDate(entries: BodyWeight[]): BodyWeight[] {
  return entries.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/**
 * Each entry paired with the mean of all entries in the trailing `windowDays`
 * (inclusive). The average is the signal; individual readings are water weight.
 */
export function rollingAverage(entries: BodyWeight[], windowDays: number): TrendPoint[] {
  const sorted = byDate(entries)
  return sorted.map((entry) => {
    const window = sorted.filter((e) => {
      const gap = daysBetween(e.date, entry.date)
      return gap >= 0 && gap < windowDays
    })
    const avgKg = window.reduce((sum, e) => sum + e.kg, 0) / window.length
    return { date: entry.date, kg: entry.kg, avgKg }
  })
}

/** Change between the latest reading and the newest reading at least `overDays` old. */
export function weightChange(entries: BodyWeight[], overDays: number, today: ISODate): number | null {
  const sorted = byDate(entries)
  const latest = sorted[sorted.length - 1]
  if (!latest) return null
  const older = sorted.filter((e) => daysBetween(e.date, today) >= overDays).pop()
  return older ? latest.kg - older.kg : null
}
```

`src/logic/units.ts`:
```ts
import type { Run, Settings } from '../types'

export const KG_PER_LB = 0.45359237

export function toDisplayWeight(kg: number, unit: Settings['unit']): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB
}

export function fromDisplayWeight(value: number, unit: Settings['unit']): number {
  return unit === 'kg' ? value : value * KG_PER_LB
}

export function formatWeight(kg: number, unit: Settings['unit']): string {
  const value = toDisplayWeight(kg, unit)
  const rounded = Math.round(value * 10) / 10
  return `${rounded}`.replace(/\.0$/, '') + ` ${unit}`
}

export function paceSecPerKm(run: Run): number | null {
  if (run.distanceKm <= 0) return null
  return Math.round(run.durationSec / run.distanceKm)
}

export function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.round(sec % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
```

`src/logic/rest.ts`:
```ts
import type { ISOTime } from '../types'

/**
 * Seconds left on the rest timer, derived from the stored start timestamp.
 * Never decrement a counter for this: intervals freeze when iOS backgrounds
 * the app or the screen locks, so a counter comes back wrong after the phone
 * has been in a pocket. Timestamp arithmetic comes back correct.
 */
export function restRemaining(
  restStartedAt: ISOTime | null,
  restSeconds: number | null,
  now: Date,
): number | null {
  if (restStartedAt === null || restSeconds === null) return null
  const elapsedMs = now.getTime() - new Date(restStartedAt).getTime()
  return Math.max(0, Math.ceil(restSeconds - elapsedMs / 1000))
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: PASS, all suites.

- [ ] **Step 5: Commit**

```bash
git add src/logic/bodyweight.ts src/logic/bodyweight.test.ts src/logic/units.ts src/logic/units.test.ts src/logic/rest.ts src/logic/rest.test.ts
git commit -m "feat: add bodyweight trend, unit conversion, pace and rest timer math"
```

---

### Task 7: IndexedDB schema and repository

**Files:**
- Create: `src/db/schema.ts`, `src/db/repo.ts`, `src/db/repo.test.ts`
- Modify: `vite.config.ts` (test `setupFiles` for `fake-indexeddb`)
- Create: `src/test/setup.ts`

**Interfaces:**
- Consumes: all types; `DEFAULT_SETTINGS`, `SCHEMA_VERSION`
- Produces:
  - `openFitDb(name?: string): Promise<IDBPDatabase<FitDb>>`
  - `loadAll(db): Promise<FitData>`
  - `putExercise(db, e)`, `putTemplate(db, t)`, `putSession(db, s)`, `putBodyWeight(db, b)`, `putRun(db, r)`, `putVisit(db, v)`, `putSettings(db, s)`
  - `deleteSession(db, id)`, `deleteBodyWeight(db, id)`, `deleteRun(db, id)`, `deleteVisit(db, date)`
  - `replaceAll(db, data: FitData): Promise<void>`
  - `ActiveSessionConflictError`
  - `startSession(db, session: Session): Promise<void>` — throws `ActiveSessionConflictError` if one is already active

- [ ] **Step 1: Add the test setup file and register it**

`src/test/setup.ts`:
```ts
import 'fake-indexeddb/auto'
```

In `vite.config.ts`, extend the `test` block:
```ts
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
```

- [ ] **Step 2: Write the failing tests**

`src/db/repo.test.ts`:
```ts
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
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test -- repo`
Expected: FAIL — cannot resolve `./schema`.

- [ ] **Step 4: Implement `src/db/schema.ts`**

```ts
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { BodyWeight, Exercise, GymVisit, ISODate, Run, Session, Split, Template } from '../types'

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
```

- [ ] **Step 5: Implement `src/db/repo.ts`**

```ts
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

export const putExercise = (db: Db, e: Exercise) => db.put('exercises', e).then(() => undefined)
export const putTemplate = (db: Db, t: Template) => db.put('templates', t).then(() => undefined)
export const putSession = (db: Db, s: Session) => db.put('sessions', s).then(() => undefined)
export const putBodyWeight = (db: Db, b: BodyWeight) => db.put('bodyweights', b).then(() => undefined)
export const putRun = (db: Db, r: Run) => db.put('runs', r).then(() => undefined)
export const putVisit = (db: Db, v: GymVisit) => db.put('visits', v).then(() => undefined)
export const putSettings = (db: Db, s: Settings) =>
  db.put('meta', s, SETTINGS_KEY).then(() => undefined)

export const deleteSession = (db: Db, id: string) => db.delete('sessions', id)
export const deleteBodyWeight = (db: Db, id: string) => db.delete('bodyweights', id)
export const deleteRun = (db: Db, id: string) => db.delete('runs', id)
export const deleteVisit = (db: Db, date: ISODate) => db.delete('visits', date)
export const deleteExercise = (db: Db, id: string) => db.delete('exercises', id)

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
  const stores = ['exercises', 'templates', 'sessions', 'bodyweights', 'runs', 'visits', 'meta'] as const
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
```

- [ ] **Step 6: Run to verify pass**

Run: `npm test -- repo`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/db src/test vite.config.ts
git commit -m "feat: add IndexedDB schema and repository layer"
```

---

### Task 8: Backup and seed data

**Files:**
- Create: `src/logic/backup.ts`, `src/logic/backup.test.ts`, `src/logic/seed.ts`

**Interfaces:**
- Consumes: `FitData`, `SCHEMA_VERSION`, `DEFAULT_SETTINGS`
- Produces:
  - `interface BackupFile extends FitData { schemaVersion: number; exportedAt: ISOTime }`
  - `buildExport(data: FitData, now: Date): BackupFile`
  - `serializeExport(data, now): string`
  - `parseImport(json: string): FitData` — throws `ImportError` on bad shape or version
  - `ImportError`
  - `backupFilename(now: Date): string`
  - `seedData(now: Date): { exercises: Exercise[]; templates: Template[] }`

- [ ] **Step 1: Write the failing tests**

`src/logic/backup.test.ts`:
```ts
import { buildExport, serializeExport, parseImport, ImportError, backupFilename } from './backup'
import { DEFAULT_SETTINGS, SCHEMA_VERSION, type FitData } from '../types'

const data: FitData = {
  exercises: [
    { id: 'bench', name: 'Bench Press', restSeconds: 180, incrementKg: 2.5, archived: false, createdAt: '2026-08-01T10:00:00.000Z' },
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
    expect(parseImport(json).sessions[0]!.entries[0]!.sets[0]).toEqual({ weightKg: 80, reps: 8, done: true })
  })

  it('drops the envelope fields, leaving only FitData keys', () => {
    const json = serializeExport(data, new Date('2026-08-01T18:40:00.000Z'))
    expect(Object.keys(parseImport(json)).sort()).toEqual(
      ['bodyweights', 'exercises', 'runs', 'sessions', 'settings', 'templates', 'visits'],
    )
  })
})

describe('parseImport validation', () => {
  it('refuses a mismatched schema version rather than guessing', () => {
    const json = JSON.stringify({ ...data, schemaVersion: 99, exportedAt: '2026-08-01T00:00:00.000Z' })
    expect(() => parseImport(json)).toThrow(ImportError)
    expect(() => parseImport(json)).toThrow(/version/i)
  })

  it('refuses a missing schema version', () => {
    expect(() => parseImport(JSON.stringify(data))).toThrow(ImportError)
  })

  it('refuses malformed JSON', () => {
    expect(() => parseImport('{ not json')).toThrow(ImportError)
  })

  it('refuses a file missing a required collection', () => {
    const { sessions: _omitted, ...rest } = data
    const json = JSON.stringify({ ...rest, schemaVersion: SCHEMA_VERSION, exportedAt: '2026-08-01T00:00:00.000Z' })
    expect(() => parseImport(json)).toThrow(/sessions/)
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- backup`
Expected: FAIL — cannot resolve `./backup`.

- [ ] **Step 3: Implement `src/logic/backup.ts`**

```ts
import {
  DEFAULT_SETTINGS,
  SCHEMA_VERSION,
  type FitData,
  type ISOTime,
  type Settings,
} from '../types'
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

const COLLECTIONS = [
  'exercises',
  'templates',
  'sessions',
  'bodyweights',
  'runs',
  'visits',
] as const

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
```

- [ ] **Step 4: Implement `src/logic/seed.ts`**

A standard PPL routine, editable in Settings. Rest defaults follow the spec: 180 s for compounds, 90 s for accessories, with heavy compounds at 210 s.

```ts
import { SPLITS, type Exercise, type Split, type Template } from '../types'

interface SeedExercise {
  id: string
  name: string
  restSeconds: number
  incrementKg: number
}

const SEED: Record<Split, SeedExercise[]> = {
  push: [
    { id: 'bench-press', name: 'Barbell Bench Press', restSeconds: 180, incrementKg: 2.5 },
    { id: 'incline-db-press', name: 'Incline Dumbbell Press', restSeconds: 150, incrementKg: 2 },
    { id: 'shoulder-press', name: 'Seated Shoulder Press', restSeconds: 150, incrementKg: 2.5 },
    { id: 'lateral-raise', name: 'Cable Lateral Raise', restSeconds: 90, incrementKg: 2.5 },
    { id: 'triceps-pushdown', name: 'Triceps Pushdown', restSeconds: 90, incrementKg: 2.5 },
    { id: 'overhead-extension', name: 'Overhead Triceps Extension', restSeconds: 90, incrementKg: 2.5 },
  ],
  pull: [
    { id: 'barbell-row', name: 'Barbell Row', restSeconds: 180, incrementKg: 2.5 },
    { id: 'lat-pulldown', name: 'Lat Pulldown', restSeconds: 150, incrementKg: 2.5 },
    { id: 'seated-row', name: 'Seated Cable Row', restSeconds: 150, incrementKg: 2.5 },
    { id: 'face-pull', name: 'Face Pull', restSeconds: 90, incrementKg: 2.5 },
    { id: 'barbell-curl', name: 'Barbell Curl', restSeconds: 90, incrementKg: 2.5 },
    { id: 'hammer-curl', name: 'Hammer Curl', restSeconds: 90, incrementKg: 2 },
  ],
  legs: [
    { id: 'squat', name: 'Barbell Squat', restSeconds: 210, incrementKg: 2.5 },
    { id: 'romanian-deadlift', name: 'Romanian Deadlift', restSeconds: 180, incrementKg: 2.5 },
    { id: 'leg-press', name: 'Leg Press', restSeconds: 180, incrementKg: 5 },
    { id: 'leg-extension', name: 'Leg Extension', restSeconds: 90, incrementKg: 2.5 },
    { id: 'leg-curl', name: 'Leg Curl', restSeconds: 90, incrementKg: 2.5 },
    { id: 'calf-raise', name: 'Standing Calf Raise', restSeconds: 90, incrementKg: 2.5 },
  ],
}

export function seedData(now: Date): { exercises: Exercise[]; templates: Template[] } {
  const createdAt = now.toISOString()
  const exercises: Exercise[] = []
  const templates: Template[] = []

  for (const split of SPLITS) {
    const list = SEED[split]
    for (const e of list) {
      exercises.push({ ...e, archived: false, createdAt })
    }
    templates.push({ split, exerciseIds: list.map((e) => e.id), updatedAt: createdAt })
  }

  return { exercises, templates }
}
```

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS, all suites.

- [ ] **Step 6: Commit**

```bash
git add src/logic/backup.ts src/logic/backup.test.ts src/logic/seed.ts
git commit -m "feat: add backup export/import and seed PPL routine"
```

---

### Task 9: App shell, store and design tokens

**Files:**
- Create: `src/store/StoreContext.tsx`, `src/components/TabBar.tsx`
- Modify: `src/App.tsx`, `src/styles.css`
- Create: `src/screens/TodayScreen.tsx`, `src/screens/ProgressScreen.tsx`, `src/screens/BodyScreen.tsx`, `src/screens/SettingsScreen.tsx` (placeholders, filled in later tasks)

**Interfaces:**
- Consumes: `openFitDb`, all `repo` functions, `seedData`, `FitData`
- Produces:
  - `<StoreProvider>` — opens the DB, seeds on first run, loads everything into state
  - `useStore(): StoreValue` where
    ```ts
    interface StoreValue {
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
    ```
  - `type Tab = 'today' | 'progress' | 'body' | 'settings'`
  - `<TabBar active onChange>`

Each mutator writes to IndexedDB **first**, then updates React state, so a failed write never shows as success.

- [ ] **Step 1: Write the design tokens into `src/styles.css`**

Full replacement. Dark-only, safe-area aware, 44 px minimum targets.

```css
:root {
  --bg: #0b0d10;
  --surface: #14181d;
  --surface-2: #1c2229;
  --line: #2a323c;
  --text: #e7ecf3;
  --dim: #96a1b0;
  --accent: #4da3ff;
  --good: #3ddc97;
  --gold: #f0b429;
  --warn: #ff6b6b;
  --radius: 14px;
  --tabbar-h: 56px;
  --pad: 16px;
}

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body, #root { height: 100%; margin: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font: 16px/1.45 -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  overscroll-behavior: none;
  touch-action: manipulation;
  -webkit-text-size-adjust: 100%;
}

.app { display: flex; flex-direction: column; height: 100%; }

.screen {
  flex: 1;
  overflow-y: auto;
  padding: var(--pad);
  padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 24px);
  -webkit-overflow-scrolling: touch;
}

.tabbar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  height: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(20, 24, 29, 0.92);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--line);
}
.tabbar button {
  background: none; border: 0;
  color: var(--dim);
  font-size: 11px; letter-spacing: 0.03em; text-transform: uppercase;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
}
.tabbar button[aria-current='page'] { color: var(--accent); }
.tabbar .glyph { font-size: 19px; line-height: 1; }

.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: var(--pad);
  margin-bottom: 12px;
}

h1 { font-size: 22px; margin: 0 0 2px; }
h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--dim); margin: 20px 0 8px; font-weight: 600; }
.sub { color: var(--dim); font-size: 13px; }
.row { display: flex; align-items: center; gap: 10px; }
.spread { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.mono { font-variant-numeric: tabular-nums; }

.btn {
  min-height: 48px;
  width: 100%;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface-2);
  font-size: 16px; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
}
.btn:active { background: #232b34; }
.btn-primary { background: var(--accent); border-color: var(--accent); color: #04121f; }
.btn-ghost { background: none; }
.btn-sm { min-height: 40px; width: auto; padding: 0 14px; font-size: 14px; font-weight: 500; }
.btn-danger { color: var(--warn); }

input, select {
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 16px;
  min-height: 44px;
  width: 100%;
}

.empty { color: var(--dim); text-align: center; padding: 32px 12px; font-size: 14px; }
```

- [ ] **Step 2: Implement `src/store/StoreContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { IDBPDatabase } from 'idb'
import { openFitDb, type FitDb } from '../db/schema'
import * as repo from '../db/repo'
import { seedData } from '../logic/seed'
import {
  type BodyWeight,
  type Exercise,
  type FitData,
  type GymVisit,
  type ISODate,
  type Run,
  type Session,
  type Settings,
  type Template,
  DEFAULT_SETTINGS,
} from '../types'

const EMPTY: FitData = {
  exercises: [], templates: [], sessions: [],
  bodyweights: [], runs: [], visits: [], settings: DEFAULT_SETTINGS,
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<IDBPDatabase<FitDb> | null>(null)
  const [data, setData] = useState<FitData>(EMPTY)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const opened = await openFitDb()
        let loaded = await repo.loadAll(opened)

        // First run: install the default PPL routine so the app is usable immediately.
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
    return () => { cancelled = true }
  }, [])

  /** Write-through: persist first, then reflect in state. A failed write never reads as success. */
  function mutate<T>(write: (db: IDBPDatabase<FitDb>) => Promise<T>, apply: (d: FitData) => FitData) {
    return async () => {
      if (!db) throw new Error('Database not ready')
      await write(db)
      setData((prev) => apply(prev))
    }
  }

  const upsert = <T,>(list: T[], item: T, key: (t: T) => unknown): T[] => {
    const i = list.findIndex((x) => key(x) === key(item))
    if (i === -1) return [...list, item]
    const next = list.slice()
    next[i] = item
    return next
  }

  const value: StoreValue = {
    data,
    ready,
    error,
    saveExercise: (e) =>
      mutate(
        (d) => repo.putExercise(d, e),
        (prev) => ({ ...prev, exercises: upsert(prev.exercises, e, (x) => x.id) }),
      )(),
    removeExercise: (id) =>
      mutate(
        (d) => repo.deleteExercise(d, id),
        (prev) => ({ ...prev, exercises: prev.exercises.filter((x) => x.id !== id) }),
      )(),
    saveTemplate: (t) =>
      mutate(
        (d) => repo.putTemplate(d, t),
        (prev) => ({ ...prev, templates: upsert(prev.templates, t, (x) => x.split) }),
      )(),
    saveSession: (s) =>
      mutate(
        (d) => repo.putSession(d, s),
        (prev) => ({ ...prev, sessions: upsert(prev.sessions, s, (x) => x.id) }),
      )(),
    beginSession: (s) =>
      mutate(
        (d) => repo.startSession(d, s),
        (prev) => ({ ...prev, sessions: upsert(prev.sessions, s, (x) => x.id) }),
      )(),
    removeSession: (id) =>
      mutate(
        (d) => repo.deleteSession(d, id),
        (prev) => ({ ...prev, sessions: prev.sessions.filter((x) => x.id !== id) }),
      )(),
    saveBodyWeight: (b) =>
      mutate(
        (d) => repo.putBodyWeight(d, b),
        (prev) => ({ ...prev, bodyweights: upsert(prev.bodyweights, b, (x) => x.id) }),
      )(),
    removeBodyWeight: (id) =>
      mutate(
        (d) => repo.deleteBodyWeight(d, id),
        (prev) => ({ ...prev, bodyweights: prev.bodyweights.filter((x) => x.id !== id) }),
      )(),
    saveRun: (r) =>
      mutate(
        (d) => repo.putRun(d, r),
        (prev) => ({ ...prev, runs: upsert(prev.runs, r, (x) => x.id) }),
      )(),
    removeRun: (id) =>
      mutate(
        (d) => repo.deleteRun(d, id),
        (prev) => ({ ...prev, runs: prev.runs.filter((x) => x.id !== id) }),
      )(),
    saveVisit: (v) =>
      mutate(
        (d) => repo.putVisit(d, v),
        (prev) => ({ ...prev, visits: upsert(prev.visits, v, (x) => x.date) }),
      )(),
    removeVisit: (date) =>
      mutate(
        (d) => repo.deleteVisit(d, date),
        (prev) => ({ ...prev, visits: prev.visits.filter((x) => x.date !== date) }),
      )(),
    saveSettings: (s) =>
      mutate(
        (d) => repo.putSettings(d, s),
        (prev) => ({ ...prev, settings: s }),
      )(),
    importData: (d) =>
      mutate(
        (database) => repo.replaceAll(database, d),
        () => d,
      )(),
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
```

- [ ] **Step 3: Implement `src/components/TabBar.tsx`**

```tsx
export type Tab = 'today' | 'progress' | 'body' | 'settings'

const TABS: { id: Tab; label: string; glyph: string }[] = [
  { id: 'today', label: 'Today', glyph: '🏋' },
  { id: 'progress', label: 'Progress', glyph: '📈' },
  { id: 'body', label: 'Body', glyph: '⚖' },
  { id: 'settings', label: 'Settings', glyph: '⚙' },
]

export default function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          aria-current={active === t.id ? 'page' : undefined}
        >
          <span className="glyph">{t.glyph}</span>
          {t.label}
        </button>
      ))}
    </nav>
  )
}
```

- [ ] **Step 4: Create the four screen placeholders**

Each file, substituting the name:
```tsx
export default function ProgressScreen() {
  return (
    <div className="screen">
      <h1>Progress</h1>
    </div>
  )
}
```
Create `TodayScreen.tsx`, `ProgressScreen.tsx`, `BodyScreen.tsx`, `SettingsScreen.tsx` this way.

- [ ] **Step 5: Wire `src/App.tsx`**

```tsx
import { useState } from 'react'
import { StoreProvider, useStore } from './store/StoreContext'
import TabBar, { type Tab } from './components/TabBar'
import TodayScreen from './screens/TodayScreen'
import ProgressScreen from './screens/ProgressScreen'
import BodyScreen from './screens/BodyScreen'
import SettingsScreen from './screens/SettingsScreen'

function Shell() {
  const { ready, error } = useStore()
  const [tab, setTab] = useState<Tab>('today')

  if (error) {
    return (
      <div className="screen">
        <h1>Storage error</h1>
        <p className="sub">{error}</p>
      </div>
    )
  }
  if (!ready) return <div className="screen empty">Loading…</div>

  return (
    <div className="app">
      {tab === 'today' && <TodayScreen />}
      {tab === 'progress' && <ProgressScreen />}
      {tab === 'body' && <BodyScreen />}
      {tab === 'settings' && <SettingsScreen />}
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
```

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm test && npm run build`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add app shell, in-memory store and tab navigation"
```

---

### Task 10: Settings — exercises, templates, backup

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`
- Create: `src/components/ExerciseEditor.tsx`, `src/components/TemplateEditor.tsx`, `src/components/Modal.tsx`
- Create: `src/logic/id.ts`

**Interfaces:**
- Consumes: `useStore`, `serializeExport`, `parseImport`, `backupFilename`, `formatWeight`, `daysBetween`
- Produces:
  - `newId(): string` from `src/logic/id.ts` — `crypto.randomUUID()`
  - `<Modal title onClose>{children}</Modal>`
  - `<ExerciseEditor>` — list, add, edit name/rest/increment, archive/unarchive
  - `<TemplateEditor split>` — reorder (up/down buttons, not drag — reliable on touch), add from exercise list, remove

- [ ] **Step 1: Create `src/logic/id.ts`**

```ts
export function newId(): string {
  return crypto.randomUUID()
}
```

- [ ] **Step 2: Create `src/components/Modal.tsx`**

```tsx
import type { ReactNode } from 'react'

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="spread" style={{ marginBottom: 12 }}>
          <strong>{title}</strong>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

Append to `src/styles.css`:
```css
.modal-backdrop {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(0, 0, 0, 0.6);
  display: flex; align-items: flex-end;
}
.modal {
  background: var(--surface);
  border-top: 1px solid var(--line);
  border-radius: var(--radius) var(--radius) 0 0;
  padding: var(--pad);
  padding-bottom: calc(var(--pad) + env(safe-area-inset-bottom));
  width: 100%;
  max-height: 85vh; overflow-y: auto;
}
.field { margin-bottom: 12px; }
.field label { display: block; font-size: 13px; color: var(--dim); margin-bottom: 6px; }
.list-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 0; border-bottom: 1px solid var(--line);
}
.list-item:last-child { border-bottom: 0; }
.grow { flex: 1; min-width: 0; }
.icon-btn {
  min-width: 44px; min-height: 44px;
  background: none; border: 0; color: var(--dim); font-size: 17px;
}
.archived { opacity: 0.45; }
```

- [ ] **Step 3: Implement `src/components/ExerciseEditor.tsx`**

Renders every exercise (archived ones dimmed at the bottom). Each row: name, `rest 3:00 · +2.5 kg` subtitle, edit and archive buttons. Edit opens a `Modal` with three fields — name (text), rest seconds (number), increment (number, in the display unit, converted through `fromDisplayWeight`). "Add exercise" creates one with `newId()`, `restSeconds: 120`, `incrementKg: 2.5`, `archived: false`.

Archiving calls `saveExercise({ ...e, archived: true })`. Deletion is only offered when the exercise appears in no session and no template — otherwise the button is replaced with "Archive" and the subtitle explains that history references it.

- [ ] **Step 4: Implement `src/components/TemplateEditor.tsx`**

Props: `{ split: Split }`. Reads `data.templates.find(t => t.split === split)`. Renders the ordered exercise names with `↑` / `↓` / `✕` buttons per row and an "Add exercise" button opening a `Modal` listing non-archived exercises not already in the template. Every change writes `saveTemplate({ split, exerciseIds, updatedAt: new Date().toISOString() })`.

Up/down buttons rather than drag-and-drop: drag on touch fights the scroll container and is unreliable in a standalone PWA.

- [ ] **Step 5: Implement `src/screens/SettingsScreen.tsx`**

Sections, in order:

1. **Backup** — `Export backup` and `Import backup` buttons, plus `Last backup: N days ago` (amber when `> 30`, `never` when null).
   - Export builds a Blob from `serializeExport(data, new Date())`, triggers a download via an anchor with `download={backupFilename(new Date())}`, then `saveSettings({ ...settings, lastBackupAt: new Date().toISOString() })`.
   - Import uses a hidden `<input type="file" accept="application/json">`. On change, read the text, `parseImport` it, then show a confirm dialog naming the file's `exportedAt` date and record counts before calling `importData`. `ImportError` messages render inline in red.
2. **Workout templates** — a `<TemplateEditor>` per split under a heading, or a segmented switch between the three.
3. **Exercises** — `<ExerciseEditor>`.
4. **Preferences** — unit `kg`/`lb` toggle, weekly target number input (1–14), rest beep checkbox. Each writes `saveSettings` immediately.

Export code:
```tsx
function exportBackup() {
  const now = new Date()
  const blob = new Blob([serializeExport(data, now)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = backupFilename(now)
  a.click()
  URL.revokeObjectURL(url)
  void saveSettings({ ...data.settings, lastBackupAt: now.toISOString() })
}
```

- [ ] **Step 6: Verify in the browser**

Run: `npm run dev`
Check: Settings shows 18 seeded exercises and three templates. Export downloads a JSON file containing the seed. Re-importing that file succeeds. Editing an exercise's rest time persists across a page reload.

- [ ] **Step 7: Verify build and commit**

```bash
npm run typecheck && npm test && npm run build
git add -A
git commit -m "feat: add settings with template editor, exercise editor and backup"
```

---

### Task 11: Session logging and rest timer

**Files:**
- Create: `src/components/Stepper.tsx`, `src/components/RestBar.tsx`, `src/screens/SessionScreen.tsx`, `src/hooks/useTicker.ts`, `src/hooks/useBeep.ts`
- Modify: `src/App.tsx` (route to the session screen), `src/screens/TodayScreen.tsx` (minimal version), `src/styles.css`

**Interfaces:**
- Consumes: `useStore`, `lastPerformance`, `prefillSets`, `emptySet`, `restRemaining`, `sessionVolume`, `nextSplit`, `activeSession`, `toDisplayWeight`, `fromDisplayWeight`, `formatDuration`, `newId`
- Produces:
  - `useTicker(ms: number, enabled: boolean): number` — returns a counter forcing re-render
  - `useBeep(): { unlock(): void; beep(): void }`
  - `<Stepper value onChange step min label>` — `−`, tappable value, `+`
  - `<RestBar session onExtend onSkip>` 
  - `<SessionScreen sessionId onExit>`

- [ ] **Step 1: Implement `src/hooks/useTicker.ts`**

```ts
import { useEffect, useState } from 'react'

/**
 * Forces a re-render every `ms` while `enabled`. Used only to refresh the rest
 * bar's display — the remaining time itself is always recomputed from the
 * stored timestamp, so a missed tick can never desynchronise the timer.
 */
export function useTicker(ms: number, enabled: boolean): number {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => setTick((t) => t + 1), ms)
    return () => clearInterval(id)
  }, [ms, enabled])
  return tick
}
```

- [ ] **Step 2: Implement `src/hooks/useBeep.ts`**

```ts
import { useRef } from 'react'

/**
 * A short synthesised beep — no audio asset, so it works offline. iOS requires
 * the AudioContext be created and resumed inside a real user gesture, hence
 * `unlock()`, which the session-start tap calls.
 */
export function useBeep() {
  const ctxRef = useRef<AudioContext | null>(null)

  function unlock() {
    if (!ctxRef.current) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      ctxRef.current = new Ctor()
    }
    void ctxRef.current.resume()
  }

  function beep() {
    const ctx = ctxRef.current
    if (!ctx || ctx.state !== 'running') return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  }

  return { unlock, beep }
}
```

- [ ] **Step 3: Implement `src/components/Stepper.tsx`**

```tsx
import { useState } from 'react'

export default function Stepper({
  value,
  onChange,
  step,
  min = 0,
  suffix,
  ariaLabel,
}: {
  value: number
  onChange: (v: number) => void
  step: number
  min?: number
  suffix?: string
  ariaLabel: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  function commit() {
    const parsed = Number(draft.replace(',', '.'))
    if (Number.isFinite(parsed)) onChange(Math.max(min, parsed))
    setEditing(false)
  }

  // Steps can be fractional (2.5 kg); round to 3dp to keep 0.1 additions clean.
  const bump = (delta: number) =>
    onChange(Math.max(min, Math.round((value + delta) * 1000) / 1000))

  return (
    <div className="stepper" role="group" aria-label={ariaLabel}>
      <button className="stepper-btn" onClick={() => bump(-step)} aria-label={`decrease ${ariaLabel}`}>−</button>
      {editing ? (
        <input
          className="stepper-input"
          type="text"
          inputMode="decimal"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
        />
      ) : (
        <button
          className="stepper-value mono"
          onClick={() => { setDraft(String(value)); setEditing(true) }}
        >
          {value}{suffix ? <span className="stepper-suffix">{suffix}</span> : null}
        </button>
      )}
      <button className="stepper-btn" onClick={() => bump(step)} aria-label={`increase ${ariaLabel}`}>+</button>
    </div>
  )
}
```

Append to `src/styles.css`:
```css
.stepper { display: flex; align-items: stretch; gap: 0; flex: 1; min-width: 0; }
.stepper-btn {
  width: 46px; min-height: 46px; flex: 0 0 46px;
  background: var(--surface-2); border: 1px solid var(--line);
  font-size: 22px; font-weight: 400; color: var(--text);
}
.stepper-btn:first-child { border-radius: 10px 0 0 10px; }
.stepper-btn:last-child { border-radius: 0 10px 10px 0; }
.stepper-btn:active { background: #283039; }
.stepper-value, .stepper-input {
  flex: 1; min-width: 0; min-height: 46px;
  background: var(--surface); border: 1px solid var(--line); border-left: 0; border-right: 0;
  border-radius: 0; text-align: center; font-size: 17px; font-weight: 600;
  color: var(--text); padding: 0 4px;
}
.stepper-suffix { font-size: 12px; color: var(--dim); margin-left: 3px; font-weight: 400; }

.set-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.set-num { width: 24px; flex: 0 0 24px; color: var(--dim); font-size: 13px; }
.check-btn {
  width: 46px; min-height: 46px; flex: 0 0 46px;
  border-radius: 10px; border: 1px solid var(--line);
  background: var(--surface-2); font-size: 18px; color: var(--dim);
}
.check-btn[data-done='true'] { background: var(--good); border-color: var(--good); color: #04180f; }

.exercise-head { margin-bottom: 10px; }
.exercise-head .name { font-size: 17px; font-weight: 600; }
.exercise-head .last { font-size: 13px; color: var(--dim); font-variant-numeric: tabular-nums; }

.restbar {
  position: fixed; left: 0; right: 0;
  bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
  background: var(--surface-2); border-top: 1px solid var(--line);
  padding: 10px var(--pad) 12px;
  z-index: 20;
}
.restbar.no-tabs { bottom: env(safe-area-inset-bottom); }
.restbar-track { height: 4px; background: var(--line); border-radius: 2px; margin-top: 8px; overflow: hidden; }
.restbar-fill { height: 100%; background: var(--accent); transition: width 0.25s linear; }
.restbar-time { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }
.restbar.done .restbar-time { color: var(--good); }
.restbar.done .restbar-fill { background: var(--good); }

.sticky-head {
  position: sticky; top: 0; z-index: 10;
  background: var(--bg); padding: 4px 0 10px; margin: -4px 0 8px;
  border-bottom: 1px solid var(--line);
}
```

- [ ] **Step 4: Implement `src/components/RestBar.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import type { Session } from '../types'
import { restRemaining } from '../logic/rest'
import { useTicker } from '../hooks/useTicker'
import { formatDuration } from '../logic/units'

export default function RestBar({
  session,
  beepEnabled,
  onBeep,
  onExtend,
  onSkip,
  withTabs = true,
}: {
  session: Session
  beepEnabled: boolean
  onBeep: () => void
  onExtend: (seconds: number) => void
  onSkip: () => void
  withTabs?: boolean
}) {
  useTicker(250, session.restStartedAt !== null)
  const remaining = restRemaining(session.restStartedAt, session.restSeconds, new Date())
  const beepedFor = useRef<string | null>(null)

  useEffect(() => {
    if (remaining !== 0 || session.restStartedAt === null) return
    if (beepedFor.current === session.restStartedAt) return
    beepedFor.current = session.restStartedAt
    if (beepEnabled) onBeep()
  }, [remaining, session.restStartedAt, beepEnabled, onBeep])

  if (remaining === null || session.restSeconds === null) return null

  const pct = Math.max(0, Math.min(100, (remaining / session.restSeconds) * 100))
  const done = remaining === 0

  return (
    <div className={`restbar${done ? ' done' : ''}${withTabs ? '' : ' no-tabs'}`}>
      <div className="spread">
        <span className="restbar-time">{done ? 'Rest done' : `⏱ ${formatDuration(remaining)}`}</span>
        <span className="row">
          <button className="btn btn-sm btn-ghost" onClick={() => onExtend(30)}>+30s</button>
          <button className="btn btn-sm btn-ghost" onClick={onSkip}>Skip</button>
        </span>
      </div>
      <div className="restbar-track">
        <div className="restbar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
```

`beepedFor` keys on `restStartedAt` so each distinct rest period beeps at most once, and a rest that ended while the app was backgrounded does not beep late on return — the effect only fires for a timestamp it has not already seen, and re-mounting after a background gap sees `remaining === 0` for a timestamp it already recorded.

- [ ] **Step 5: Implement `src/screens/SessionScreen.tsx`**

Structure:

- Props: `{ sessionId: string; onExit: () => void }`. Reads the session from the store; if it is gone, calls `onExit()`.
- Sticky header: `PUSH · started 18:04` on the left, `✓ Finish` on the right, plus a `Discard` button in an overflow.
- Per entry, in template order:
  - `<div className="exercise-head">` with the exercise name and, when history exists, `last time · {daysAgo}d ago` plus `{weight} × {reps},{reps},…`.
  - One `.set-row` per set: set number, weight `<Stepper step={exercise.incrementKg} suffix={unit}>`, reps `<Stepper step={1}>`, and the check button.
  - `+ set` duplicates the last set with `done: false`.
- `+ add exercise` opens a `Modal` listing non-archived exercises absent from the session.
- Weight steppers work in **display units**: the value shown is `toDisplayWeight(set.weightKg, unit)` and `onChange` stores `fromDisplayWeight(v, unit)`.
- `<RestBar withTabs={false}>` at the bottom (the session screen hides the tab bar).

Session creation, in `TodayScreen`:
```tsx
async function startSplit(split: Split) {
  unlock() // unlock the AudioContext on this real user gesture
  const now = new Date()
  const template = data.templates.find((t) => t.split === split)
  const entries = (template?.exerciseIds ?? []).map((exerciseId) => {
    const last = lastPerformance(data.sessions, exerciseId, todayISO(now))
    return { exerciseId, sets: last ? prefillSets(last.sets) : [emptySet()] }
  })
  const session: Session = {
    id: newId(), split, date: todayISO(now), startedAt: now.toISOString(),
    finishedAt: null, entries, restStartedAt: null, restSeconds: null,
  }
  await beginSession(session)
  setOpenSessionId(session.id)
}
```

Marking a set done, in `SessionScreen`:
```tsx
function toggleSet(entryIndex: number, setIndex: number) {
  const entries = session.entries.map((e, i) =>
    i !== entryIndex ? e : { ...e, sets: e.sets.map((s, j) => (j !== setIndex ? s : { ...s, done: !s.done })) },
  )
  const nowDone = !session.entries[entryIndex]!.sets[setIndex]!.done
  const exercise = data.exercises.find((x) => x.id === session.entries[entryIndex]!.exerciseId)
  void saveSession({
    ...session,
    entries,
    // Completing a set starts the rest timer; un-checking leaves it alone.
    restStartedAt: nowDone ? new Date().toISOString() : session.restStartedAt,
    restSeconds: nowDone ? (exercise?.restSeconds ?? 120) : session.restSeconds,
  })
}
```

Finishing:
```tsx
function finish() {
  void saveSession({ ...session, finishedAt: new Date().toISOString(), restStartedAt: null, restSeconds: null })
  onExit()
}
```

- [ ] **Step 6: Minimal `src/screens/TodayScreen.tsx`**

For this task: date heading, a resume banner when `activeSession(data.sessions)` exists, `Next up: {SPLIT_LABEL[nextSplit(data.sessions)]}`, one primary button for the suggested split and two secondary buttons for the others. The full attendance card, week ring and quick-adds land in Task 13.

- [ ] **Step 7: Route the session screen in `src/App.tsx`**

Hold `const [openSessionId, setOpenSessionId] = useState<string | null>(null)` in `Shell`, lifted via context or passed down. When set, render `<SessionScreen sessionId={openSessionId} onExit={() => setOpenSessionId(null)} />` **instead of** the tab content and `<TabBar>`. On mount, if `activeSession(data.sessions)` exists, do not auto-open — show the resume banner, so the app always opens on Today.

Simplest wiring: a second small context in `App.tsx`:
```tsx
export const SessionNav = createContext<{ open: (id: string) => void }>({ open: () => {} })
```
`TodayScreen` consumes it.

- [ ] **Step 8: Verify a full workout in the browser**

Run: `npm run dev`
Check, in order:
1. Today shows `Next up: Push` on a fresh install.
2. Tapping `Start Push` opens the session with all six Push exercises, each with one empty set.
3. Setting bench to 80 kg × 8 and tapping ✓ starts a 3:00 rest bar that counts down.
4. `+30s` extends it; `Skip` dismisses it.
5. `+ set` adds a row prefilled from the previous set.
6. Reloading mid-session keeps every entered value.
7. `✓ Finish` returns to Today, which now shows `Next up: Pull`.
8. Starting Push again prefills bench at 80 × 8 with `last time · 0d ago`.

- [ ] **Step 9: Verify build and commit**

```bash
npm run typecheck && npm test && npm run build
git add -A
git commit -m "feat: add session logging with prefill, steppers and rest timer"
```

---

### Task 12: PWA manifest, icons and deployment

**Files:**
- Create: `assets/icon.svg`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`
- Modify: `vite.config.ts`, `index.html`, `package.json`
- Create: `.github/workflows/deploy.yml` (GitHub Pages path), `vercel.json` (Vercel path)

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: an installable, offline-capable build

- [ ] **Step 1: Create the icon source**

`assets/icon.svg` — a dumbbell on the app's dark background, 1024×1024:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#0b0d10"/>
  <g fill="#4da3ff">
    <rect x="150" y="412" width="90" height="200" rx="22"/>
    <rect x="784" y="412" width="90" height="200" rx="22"/>
    <rect x="256" y="452" width="72" height="120" rx="18"/>
    <rect x="696" y="452" width="72" height="120" rx="18"/>
    <rect x="328" y="482" width="368" height="60" rx="20"/>
  </g>
</svg>
```

- [ ] **Step 2: Render the PNG icons**

```bash
mkdir -p public
rsvg-convert -w 180 -h 180 assets/icon.svg -o public/apple-touch-icon.png
rsvg-convert -w 192 -h 192 assets/icon.svg -o public/icon-192.png
rsvg-convert -w 512 -h 512 assets/icon.svg -o public/icon-512.png
cp public/icon-512.png public/icon-maskable-512.png
```

Verify: `file public/*.png` reports four PNGs at the expected dimensions.

- [ ] **Step 3: Add the PWA plugin to `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'FitApp — PPL Tracker',
        short_name: 'FitApp',
        description: 'Push/Pull/Legs training log',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0d10',
        theme_color: '#0b0d10',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
})
```

`base` is read from an env var because GitHub Pages serves a project site under `/fitapp/` while Vercel serves at the root. Getting this wrong yields a blank page with 404s on the JS bundle.

- [ ] **Step 4: Reference the apple-touch-icon in `index.html`**

Add inside `<head>`:
```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

- [ ] **Step 5: Build and verify the service worker**

```bash
npm run build
ls dist/sw.js dist/manifest.webmanifest
npx vite preview --host
```
Check in a desktop browser at the preview URL: DevTools → Application shows the manifest and a registered service worker; the app still loads with the network tab set to offline.

- [ ] **Step 6: Choose and configure the deployment target**

Two paths. **Pick one and record the URL in the README, because IndexedDB is bound to the origin.**

*Path A — Vercel (root path, no base override):*
```bash
npx vercel login    # interactive; the user must run this themselves
npx vercel --prod
```
`vercel.json`:
```json
{ "buildCommand": "npm run build", "outputDirectory": "dist", "framework": null }
```

*Path B — GitHub Pages (requires the repo to be public, or a paid plan for Pages on private repos):*

`.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          VITE_BASE: /fitapp/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - id: deploy
        uses: actions/deploy-pages@v4
```

Then: `gh api -X POST repos/:owner/:repo/pages -f build_type=workflow` (or enable Pages → GitHub Actions in repo settings).

- [ ] **Step 7: Install on the iPhone and verify offline**

1. Open the deployed HTTPS URL in Safari on the iPhone.
2. Share → **Add to Home Screen**.
3. Close Safari. Launch from the home-screen icon: no browser chrome, tab bar clear of the home indicator.
4. Enable Airplane Mode. Relaunch. The app must open and be fully usable.
5. Log a real workout offline; confirm it survives a force-quit and relaunch.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add PWA manifest, icons and deployment config"
git push
```

---

### Task 13: Today screen, complete

**Files:**
- Modify: `src/screens/TodayScreen.tsx`, `src/styles.css`
- Create: `src/components/WeekRing.tsx`, `src/components/QuickAddRun.tsx`, `src/components/QuickAddWeight.tsx`

**Interfaces:**
- Consumes: `attendedToday`, `weekAttendance`, `daysSinceAll`, `STALE_SPLIT_DAYS`, `nextSplit`, `activeSession`, `sessionVolume`, `finishedSessions`, `daysBetween`, `formatWeight`, `formatDuration`, `paceSecPerKm`, `newId`
- Produces:
  - `<WeekRing count target>` — dot row capped at `target`, numeric `count / target`, gold at or past target
  - `<QuickAddRun onDone>` — modal: distance km, minutes, seconds; shows derived pace live
  - `<QuickAddWeight onDone>` — modal: single weight field in the display unit

- [ ] **Step 1: Implement `src/components/WeekRing.tsx`**

```tsx
export default function WeekRing({ count, target }: { count: number; target: number }) {
  const hit = count >= target
  return (
    <div className="spread">
      <div className="dots">
        {Array.from({ length: target }, (_, i) => (
          <span key={i} className={`dot${i < count ? ' filled' : ''}${hit ? ' gold' : ''}`} />
        ))}
      </div>
      <strong className={`mono${hit ? ' gold-text' : ''}`}>
        {count} / {target}
      </strong>
    </div>
  )
}
```

The dot row is capped at `target` while the label shows the true count, so a seventh session in a six-target week reads `7 / 6` in gold with six filled dots rather than growing the row.

Append to `src/styles.css`:
```css
.dots { display: flex; gap: 7px; }
.dot { width: 11px; height: 11px; border-radius: 50%; border: 1.5px solid var(--line); }
.dot.filled { background: var(--accent); border-color: var(--accent); }
.dot.filled.gold { background: var(--gold); border-color: var(--gold); }
.gold-text { color: var(--gold); }
.since { display: flex; gap: 14px; flex-wrap: wrap; font-size: 13px; color: var(--dim); margin-top: 10px; }
.since .stale { color: var(--gold); }
.status-card { border-left: 3px solid var(--line); }
.status-card.attended { border-left-color: var(--good); }
.status-icon { font-size: 20px; margin-right: 8px; }
.btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
```

- [ ] **Step 2: Implement the quick-add modals**

`QuickAddRun` — three number inputs (`inputMode="decimal"` for km, `"numeric"` for min/sec), a live `→ pace 5:18 /km` line computed with `paceSecPerKm`, and Save writing `saveRun({ id: newId(), date: todayISO(new Date()), distanceKm, durationSec: min * 60 + sec })`. Save is disabled while `distanceKm <= 0`.

`QuickAddWeight` — one field, defaulting to the most recent entry's value so it is a nudge away from the last reading rather than a blank. Save writes `saveBodyWeight({ id: newId(), date: todayISO(new Date()), kg: fromDisplayWeight(value, unit) })`.

- [ ] **Step 3: Implement `src/screens/TodayScreen.tsx`**

Order on screen:

1. `TODAY · Sat Aug 1` heading (`toLocaleDateString` with `weekday: 'short', month: 'short', day: 'numeric'`).
2. **Resume banner** when an active session exists: `In progress — Push` plus a `Resume` button. Rendered above the status card, because resuming beats starting.
3. **Status card**:
   - Not attended: `○ Haven't trained today`, `Next up: PULL`, a primary `Start Pull`, and a ghost `went, don't log` writing `saveVisit({ date: todayISO(now) })`.
   - Attended: `✓ Trained today — Push` with `{duration} · {volume} kg volume` from the day's last finished session (`formatDuration` over `finishedAt − startedAt`, `sessionVolume`). When attendance came only from a manual visit: `✓ Marked as a gym visit` plus an `undo` calling `removeVisit`.
   - Below either state, a `.btn-grid` with the two non-suggested splits.
4. **`THIS WEEK`** heading, `<WeekRing count={weekAttendance(...).count} target={settings.weeklyTarget} />`, and a letter row under the dots showing the splits logged this week (`P P L`) derived from `splitsByDate`.
5. **`.since` row**: `Push 2d · Pull 5d · Legs 11d ⚠` from `daysSinceAll`. Never-trained splits read `Legs —`. A gap `> STALE_SPLIT_DAYS` gets `.stale` and the ⚠.
6. **Runs this week: N** counted from `data.runs` inside `weekBounds`.
7. `.btn-grid` with `+ run` and `+ weight`. The weight button gets `.btn-primary` when the newest bodyweight entry is 8 or more days old, or when none exists.

- [ ] **Step 4: Verify in the browser**

Run: `npm run dev`
Check:
1. Fresh install shows `○ Haven't trained today`, `Next up: Push`, `0 / 6`, and all three splits at `—`.
2. `went, don't log` flips the card to `✓ Marked as a gym visit` and the ring to `1 / 6`; `undo` reverses both.
3. Finishing a Push workout shows `✓ Trained today — Push` with a plausible duration and volume.
4. Adding a run increments `Runs this week`.
5. Adding a weight removes the emphasis from the `+ weight` button.

- [ ] **Step 5: Verify build and commit**

```bash
npm run typecheck && npm test && npm run build
git add -A
git commit -m "feat: complete Today screen with attendance, week ring and quick-adds"
```

---

### Task 14: Body screen and the chart component

**Files:**
- Create: `src/components/LineChart.tsx`
- Modify: `src/screens/BodyScreen.tsx`

**Interfaces:**
- Consumes: `rollingAverage`, `weightChange`, `formatWeight`, `paceSecPerKm`, `formatPace`, `formatDuration`, `daysBetween`, `todayISO`
- Produces:
  - ```ts
    interface Series { points: { x: number; y: number }[]; color: string; kind: 'line' | 'dots' }
    ```
  - `<LineChart series height yLabel xTicks>` — responsive SVG using `viewBox` and `preserveAspectRatio="none"` on the plot area only, so it fills the card width at any screen size

- [ ] **Step 1: Implement `src/components/LineChart.tsx`**

A single generic chart used by both Body and Progress. Requirements:

- Accepts one or more `Series`; `x` is a numeric day offset, `y` the value.
- Computes the y-domain from all series with 6% headroom, and never a zero-height domain (a flat series gets ±1 padding).
- Renders: a faint horizontal gridline and left-edge label at the domain min, mid and max (values via a `format` prop); a `polyline` per `'line'` series; a `circle` per point for `'dots'` series.
- Fixed internal coordinate space of `320 × height` with `viewBox` scaling, so no measurement or resize observer is needed.
- Returns a `.empty` placeholder when every series is empty.
- Colors come from props, not hardcoded, so Progress can use a different accent.

```tsx
export interface Series {
  points: { x: number; y: number }[]
  color: string
  kind: 'line' | 'dots'
}

const W = 320
const PAD_L = 34
const PAD_R = 6
const PAD_T = 8
const PAD_B = 18

export default function LineChart({
  series,
  height = 150,
  format = (v: number) => String(Math.round(v * 10) / 10),
  xLabels = [],
}: {
  series: Series[]
  height?: number
  format?: (v: number) => string
  xLabels?: { x: number; label: string }[]
}) {
  const all = series.flatMap((s) => s.points)
  if (all.length === 0) return <div className="empty">No data yet</div>

  const xs = all.map((p) => p.x)
  const ys = all.map((p) => p.y)
  let yMin = Math.min(...ys)
  let yMax = Math.max(...ys)
  if (yMax - yMin < 0.001) { yMin -= 1; yMax += 1 }
  const headroom = (yMax - yMin) * 0.06
  yMin -= headroom
  yMax += headroom

  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  const xSpan = xMax - xMin || 1

  const px = (x: number) => PAD_L + ((x - xMin) / xSpan) * (W - PAD_L - PAD_R)
  const py = (y: number) => PAD_T + (1 - (y - yMin) / (yMax - yMin)) * (height - PAD_T - PAD_B)

  const gridValues = [yMin + headroom, (yMin + yMax) / 2, yMax - headroom]

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${height}`} role="img">
      {gridValues.map((v, i) => (
        <g key={i}>
          <line x1={PAD_L} x2={W - PAD_R} y1={py(v)} y2={py(v)} stroke="var(--line)" strokeWidth="0.5" />
          <text x="2" y={py(v) + 3.5} fill="var(--dim)" fontSize="8.5">{format(v)}</text>
        </g>
      ))}
      {xLabels.map((t, i) => (
        <text key={i} x={px(t.x)} y={height - 4} fill="var(--dim)" fontSize="8.5" textAnchor="middle">
          {t.label}
        </text>
      ))}
      {series.map((s, i) =>
        s.kind === 'line' ? (
          <polyline
            key={i}
            fill="none"
            stroke={s.color}
            strokeWidth="1.8"
            strokeLinejoin="round"
            points={s.points.map((p) => `${px(p.x)},${py(p.y)}`).join(' ')}
          />
        ) : (
          <g key={i}>
            {s.points.map((p, j) => (
              <circle key={j} cx={px(p.x)} cy={py(p.y)} r="2.4" fill={s.color} />
            ))}
          </g>
        ),
      )}
    </svg>
  )
}
```

Append to `src/styles.css`:
```css
.chart { width: 100%; height: auto; display: block; }
.stat { display: flex; gap: 20px; margin-top: 10px; }
.stat .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--dim); }
.stat .value { font-size: 19px; font-weight: 700; font-variant-numeric: tabular-nums; }
.down { color: var(--good); }
.up { color: var(--warn); }
```

- [ ] **Step 2: Implement `src/screens/BodyScreen.tsx`**

1. **Bodyweight card** — `<LineChart>` with two series: `dots` for raw entries (`var(--dim)`) and `line` for the rolling average (`var(--accent)`). `x` is `daysBetween(firstDate, entryDate)`; `xLabels` mark the first, middle and last month. Below the chart, a `.stat` row: `NOW` (latest entry) and `4 WK` (`weightChange(entries, 28, today)`, signed, `.down` when negative since that is the usual goal, `.up` when positive).
2. `+ log weight` button reusing `<QuickAddWeight>`.
3. **Entry list**, newest first: date, weight, and a `✕` calling `removeBodyWeight` behind a confirm.
4. **Runs card** — `+ log run` reusing `<QuickAddRun>`, then a list: date, `5.0 km`, `26:30`, `5:18 /km`, with a `✕` calling `removeRun`.
5. Empty states: `No weigh-ins yet — log one to start the trend.` / `No runs logged yet.`

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`
Check: three weight entries on different days render three dots and a smoothed line; the `4 WK` stat reads `—` until an entry is 28+ days old; a 5 km / 26:30 run lists as `5:18 /km`.

- [ ] **Step 4: Verify build and commit**

```bash
npm run typecheck && npm test && npm run build
git add -A
git commit -m "feat: add Body screen with bodyweight trend chart and run log"
```

---

### Task 15: Progress screen

**Files:**
- Modify: `src/screens/ProgressScreen.tsx`
- Create: `src/components/Segmented.tsx`, `src/components/RecapCard.tsx`, `src/components/ExerciseProgress.tsx`, `src/components/PrList.tsx`, `src/components/MonthCalendar.tsx`

**Interfaces:**
- Consumes: `finishedSessions`, `lastPerformance`, `personalRecord`, `topSetKg`, `sessionVolume`, `e1rm`, `entryFor`, `attendedDates`, `daysBetween`, `datesInRange`, `weekBounds`, `formatWeight`, `formatDuration`, `LineChart`
- Produces:
  - `<Segmented options value onChange>`
  - `<RecapCard split>` — last finished session for that split, in full
  - `<ExerciseProgress>` — exercise picker, `topSetKg` chart, session list with PR markers
  - `<PrList>` — every exercise's best set, newest first
  - `<MonthCalendar month>` — day grid with split letters, visit dots, run markers, weekly totals

- [ ] **Step 1: Implement `src/components/Segmented.tsx`**

```tsx
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={o.id === value}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
```

Append to `src/styles.css`:
```css
.segmented {
  display: flex; gap: 2px; padding: 3px;
  background: var(--surface-2); border-radius: 11px; margin-bottom: 14px;
}
.segmented button {
  flex: 1; min-height: 38px; border: 0; border-radius: 8px;
  background: none; color: var(--dim); font-size: 13px; font-weight: 600;
}
.segmented button[aria-selected='true'] { background: var(--surface); color: var(--text); }

.cal { display: grid; grid-template-columns: repeat(7, 1fr) auto; gap: 3px; }
.cal .dow { font-size: 10px; color: var(--dim); text-align: center; padding-bottom: 4px; }
.cal .day {
  aspect-ratio: 1; border-radius: 8px; background: var(--surface-2);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-size: 11px; color: var(--dim); gap: 1px;
}
.cal .day.blank { background: none; }
.cal .day.attended { background: #1e3a52; color: var(--text); font-weight: 700; }
.cal .day .run { font-size: 8px; color: var(--good); }
.cal .wk { font-size: 10px; color: var(--dim); display: flex; align-items: center; padding-left: 6px; }
.pr-row { display: flex; justify-content: space-between; padding: 11px 0; border-bottom: 1px solid var(--line); }
.pr-row:last-child { border-bottom: 0; }
.pr-badge { color: var(--gold); font-size: 11px; margin-left: 6px; }
```

- [ ] **Step 2: Implement `<RecapCard>`**

Props `{ split: Split }`. Finds `finishedSessions(data.sessions).find(s => s.split === split)`. Renders `LAST PUSH — Tue Jul 29` plus `· 5 days ago`, then one line per entry: exercise name, and the done sets as `80 × 8,8,7`. Footer: `Volume 4,120 kg · 48 min`. Empty state: `No Push session logged yet.`

The Recap view stacks one `<RecapCard>` per split.

- [ ] **Step 3: Implement `<ExerciseProgress>`**

- A `<select>` of non-archived exercises, defaulting to the first exercise in the Push template.
- Chart: one `line` series of `topSetKg` per finished session containing the exercise, `x = daysBetween(firstDate, sessionDate)`, plus a `dots` series over the same points so single-session history is still visible. `format` appends nothing (the y-axis is kg).
- `xLabels`: first and last session dates as `Jul 18`.
- Under the chart, a `.stat` row: `PR` (`formatWeight(pr.weightKg)` × reps) and `BEST e1RM` rounded to 1 dp.
- Session list, newest first: `Aug 1 · 82.5 × 8,8,7` with a `↑ PR` badge on the session that produced the current PR.

- [ ] **Step 4: Implement `<PrList>`**

For every non-archived exercise with a `personalRecord`, a `.pr-row`: name on the left, `82.5 kg × 8` and the date on the right. Sorted by PR date descending, so recent progress is at the top. Exercises with no history are omitted. Empty state: `No PRs yet — finish a workout first.`

- [ ] **Step 5: Implement `<MonthCalendar>`**

- State: a month cursor, defaulting to the current month, with `‹` / `›` buttons and a `August 2026` label.
- Grid: seven day-of-week headers starting Monday, blank cells for the leading offset, then one `.day` per date.
- Each day shows the split initials of finished sessions on it (`P`, `P`, `L`), a `•` when attendance came only from a manual visit, and a small `R` when a run is logged that date. `.attended` styling applies when the date is in `attendedDates`.
- An eighth column per row shows that week's attended-day count.
- Future dates in the current month render dimmed and empty.

- [ ] **Step 6: Implement `src/screens/ProgressScreen.tsx`**

`<Segmented options={[{id:'recap',label:'Recap'},{id:'exercise',label:'Exercise'},{id:'prs',label:'PRs'},{id:'calendar',label:'Calendar'}]}>` above the selected view.

- [ ] **Step 7: Verify in the browser**

Run: `npm run dev`
Check, after logging two Push sessions with different weights:
1. Recap shows the newer session with the correct gap and volume.
2. Exercise chart plots two points, rising if the weight went up.
3. PRs lists bench at the heavier of the two.
4. Calendar marks both dates with `P` and shows the right weekly count.

- [ ] **Step 8: Verify build and commit**

```bash
npm run typecheck && npm test && npm run build
git add -A
git commit -m "feat: add Progress screen with recap, charts, PRs and calendar"
```

---

### Task 16: Wake lock, backup nudge and README

**Files:**
- Create: `src/hooks/useWakeLock.ts`, `README.md`
- Modify: `src/screens/SessionScreen.tsx`, `src/screens/TodayScreen.tsx`

**Interfaces:**
- Consumes: `useStore`, `daysBetween`
- Produces: `useWakeLock(active: boolean): void`

- [ ] **Step 1: Implement `src/hooks/useWakeLock.ts`**

```ts
import { useEffect } from 'react'

interface WakeLockSentinel { release(): Promise<void> }
interface WakeLockNavigator {
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinel> }
}

/**
 * Keeps the screen awake during a workout. Re-acquired on visibilitychange
 * because iOS releases the lock whenever the app is backgrounded.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const wakeLock = (navigator as Navigator & WakeLockNavigator).wakeLock
    if (!wakeLock) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        sentinel = await wakeLock.request('screen')
        if (cancelled) void sentinel.release()
      } catch {
        // Denied or unsupported — the workout still logs fine.
      }
    }

    void acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', acquire)
      void sentinel?.release()
      sentinel = null
    }
  }, [active])
}
```

Call `useWakeLock(true)` at the top of `SessionScreen`.

- [ ] **Step 2: Add the backup nudge to `TodayScreen`**

Below the quick-add row, when `settings.lastBackupAt` is null or `daysBetween(toISODate(new Date(lastBackupAt)), todayISO(now)) > 30`:

```tsx
<div className="card nudge">
  <span>⚠ Last backup {label} — this is the only copy of your data.</span>
  <button className="btn btn-sm" onClick={() => onGoToSettings()}>Back up</button>
</div>
```

`label` is `never` or `N days ago`. `onGoToSettings` switches the tab, so the nudge is one tap from being resolved. Append:
```css
.nudge { border-color: var(--gold); color: var(--gold); font-size: 13px; display: flex; align-items: center; gap: 10px; justify-content: space-between; }
```

- [ ] **Step 3: Write `README.md`**

Must state: what the app is; that **data lives only in this browser's IndexedDB on this device**; that it must be launched from the home-screen icon or iOS may evict the data; that **the deployed URL must never change** because IndexedDB is per-origin; the deployed URL itself; how to export and where backups go; and the dev commands (`npm install`, `npm run dev`, `npm test`, `npm run build`).

- [ ] **Step 4: Full verification**

```bash
npm run typecheck && npm test && npm run build
```
Then walk the whole app once on the phone: start a workout, rest timer beeps, finish, check Progress and Body, export a backup.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: add wake lock, backup nudge and README"
git push
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| §4 Architecture, three-layer boundaries | 1, 2–8 (logic), 7 (db), 9 (UI shell) |
| §5 Data model, all stores and indexes | 2 (types), 7 (schema) |
| §5 kg-canonical storage | Global constraint; 6 (`units.ts`), 11 (stepper conversion) |
| §5 Single-active-session invariant | 7 (`startSession`) |
| §5 Archive-not-delete | 7 (`repo`), 10 (`ExerciseEditor`) |
| §5 `visits` keyed by date / idempotent | 7 (test) |
| §6 All eleven derived reads + `restRemaining`, `topSetKg` | 3, 4, 5, 6 |
| §7.1 Today | 11 (minimal), 13 (complete) |
| §7.2 Active session | 11 |
| §7.3 Progress, four views | 15 |
| §7.4 Body | 14 |
| §7.5 Settings | 10 |
| §8 Rest timer, timestamp-derived, beep, no late beep | 6 (`rest.ts`), 11 (`RestBar`, `useBeep`) |
| §9 Backup, replace-all, version refusal | 8, 10 |
| §10 PWA and iOS specifics | 1 (viewport, 16 px, touch-action), 9 (safe area), 12 (manifest, SW, icons), 16 (wake lock) |
| §11 Testing, all 17 cases | 2–8 |
| §12 Build phases 1–8 | 1+7+8+9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 |
| §13 Defaults | 2 (`DEFAULT_SETTINGS`), 8 (`seed.ts`) |
| §14 Risks: eviction, backup nudge, stable origin | 12 (install), 16 (nudge, README) |

No gaps.

**Placeholder scan:** No `TBD`, `TODO`, or "add error handling" steps. Every code step carries real code. UI tasks (10, 13, 14, 15) specify exact files, props, data sources, ordering and empty states, with code given for the non-obvious parts — the steppers, the timestamp-derived rest bar, the SVG chart, the export anchor, the wake-lock re-acquisition.

**Type consistency checked:**
- `incrementKg` and `weightKg` used uniformly from Task 2 onward; no bare `increment` or `weight` survives.
- `lastPerformance(sessions, exerciseId, today)` — three args at every call site (Task 11 `startSplit`, Task 15).
- `daysSince(sessions, split, today)` and `daysSinceAll(sessions, today)` — `today` is an `ISODate`, while `attendedToday`/`weekAttendance` take a `Date` named `now`. Deliberate: the former compare stored dates, the latter must derive today's date themselves.
- `restRemaining(restStartedAt, restSeconds, now)` — same signature in `rest.ts`, its tests, and `RestBar`.
- `Series` from `LineChart` consumed identically in Tasks 14 and 15.
- `StoreValue` mutator names (`saveSession`, `beginSession`, `saveVisit`, `removeVisit`, `importData`) match every call site in Tasks 10, 11, 13, 14, 15.
- `Settings.unit` is `'kg' | 'lb'`; `toDisplayWeight`/`fromDisplayWeight`/`formatWeight` all take it as their second argument.
