# PPL Gym Tracker — Design Spec

**Date:** 2026-08-01
**Status:** Approved for planning
**Audience:** single user (the author), single device (iPhone), installed to home screen

---

## 1. Purpose

A personal Push/Pull/Legs training log, installed as a home-screen PWA on iPhone. It answers four questions:

1. **Did I train today?** — and am I on pace for 6 sessions this week?
2. **What did I lift last time?** — shown inline while logging, so progression needs no arithmetic.
3. **Am I actually getting stronger?** — per-exercise history, charts, PRs.
4. **What is my bodyweight doing?** — trend, not daily noise.

Plus running logged as distance and time.

Success criterion: logging a full workout requires almost no typing, and the app opens instantly in a gym with no cell signal.

## 2. Non-goals

Explicitly cut. Not "later" — cut.

- Accounts, login, multi-user, sharing, social
- Server-side anything; no sync, no API
- Exercise demos, images, instructions, muscle diagrams
- RPE / RIR, supersets, drop sets as first-class structures, periodization blocks
- Apple Health / HealthKit integration, GPS run tracking
- Push notifications
- Light mode
- Plate calculator (revisit only if the app proves itself)

## 3. Constraints

- **Storage is local only.** IndexedDB in Safari, scoped to one origin. There is no server copy.
- **The origin must never change.** IndexedDB is per-origin; a new URL is a new empty app. The deployed URL is permanent.
- **Must be launched from the home-screen icon.** iOS evicts site data for origins unvisited for ~7 days; installed PWAs are exempt. Opening it as a Safari tab instead re-exposes it to eviction.
- **Offline is mandatory**, not a nice-to-have. Gyms have no signal.
- **The export backup is the only disaster recovery.** Treated as a first-class feature, not a footnote.

## 4. Architecture

```
┌─────────────────────────────────────────┐
│  React UI (screens, 4 tabs)             │
├─────────────────────────────────────────┤
│  Derived reads  (pure functions)        │  ← unit tested
│  lastPerformance, e1rm, PR, volume,     │
│  rollingAverage, nextSplit, attendance  │
├─────────────────────────────────────────┤
│  Repository layer (idb wrappers)        │
├─────────────────────────────────────────┤
│  IndexedDB  ·  db 'fitapp'  v1          │
└─────────────────────────────────────────┘
   Service worker precaches the app shell
```

**Stack:** Vite + React + TypeScript. `idb` for IndexedDB. `vite-plugin-pwa` for the service worker and manifest. Vitest for logic tests. No UI library, no chart library — charts are hand-rolled SVG (four simple charts do not justify a charting dependency, and hand-rolled keeps the bundle small and fully offline).

**Deployment:** Vercel free tier, HTTPS, stable URL.

**Boundaries.** Three layers with one job each:

- `src/db/` — schema, migrations, CRUD. Knows nothing about training concepts beyond record shapes.
- `src/logic/` — pure functions over records. No I/O, no React. This is where every test lives.
- `src/screens/`, `src/components/` — rendering and input. Calls the repository, calls logic, holds no domain rules.

A rule that computes anything (a PR, a next split, a days-since) belongs in `src/logic/`, never inline in a component. That is what makes it testable.

## 5. Data model

```ts
type Split = 'push' | 'pull' | 'legs'
type ISODate = string      // 'YYYY-MM-DD', local calendar day
type ISOTime = string      // full ISO-8601 timestamp

interface Exercise {
  id: string               // uuid
  name: string
  restSeconds: number      // default rest for this exercise, e.g. 180 / 90
  incrementKg: number      // smallest plate step, e.g. 2.5
  archived: boolean        // hidden from pickers; history preserved
  createdAt: ISOTime
}

interface Template {
  split: Split             // primary key — exactly three rows, ever
  exerciseIds: string[]    // ordered
  updatedAt: ISOTime
}

interface SetEntry {
  weightKg: number         // ALWAYS kilograms; 0 permitted (bodyweight)
  reps: number
  done: boolean
}

interface SessionEntry {
  exerciseId: string
  sets: SetEntry[]
  note?: string
}

interface Session {
  id: string
  split: Split
  date: ISODate
  startedAt: ISOTime
  finishedAt: ISOTime | null    // null ⇒ this is the active session
  entries: SessionEntry[]
  restStartedAt: ISOTime | null // running rest timer, or null
  restSeconds: number | null    // duration of the running timer
}

interface BodyWeight { id: string; date: ISODate; kg: number }

interface Run { id: string; date: ISODate; distanceKm: number; durationSec: number }

interface GymVisit { date: ISODate; note?: string }   // manual attendance only

interface Settings {
  unit: 'kg' | 'lb'
  weeklyTarget: number          // default 6
  restBeepEnabled: boolean      // default true
  lastBackupAt: ISOTime | null
}
```

### Object stores

| Store | Key | Indexes |
|---|---|---|
| `exercises` | `id` | — |
| `templates` | `split` | — |
| `sessions` | `id` | `by-date` (date), `by-split-date` ([split, date]) |
| `bodyweights` | `id` | `by-date` |
| `runs` | `id` | `by-date` |
| `visits` | `date` | — |
| `meta` | `key` | — (holds `settings`, `schemaVersion`) |

**Design notes.**

- **Sets are embedded in the session, not a separate store.** A session is always read whole; separating sets would add joins for no gain.
- **`visits` is keyed by date**, making a manual mark idempotent — tapping twice cannot create two visits for one day.
- **Attendance is derived, never stored twice.** A day counts as attended if a finished session exists for it *or* a `GymVisit` exists for it. Finishing a workout does not write a `GymVisit`.
- **Invariant:** at most one `Session` with `finishedAt === null`. Enforced in the repository: starting a session while another is active is rejected; the UI offers resume or discard instead.
- **Exercises are archived, not deleted**, so historical sessions never dangle.
- **All weights are stored in kilograms, always.** `Settings.unit` is a *display* setting only: values are converted at the render and input boundary, never in storage. Storing in the currently-selected unit would make historical records ambiguous the moment the toggle flips, and would silently corrupt every chart and PR. Hence the `Kg` suffix on every stored weight field.

## 6. Derived reads (`src/logic/`)

All pure. All unit tested.

| Function | Semantics |
|---|---|
| `lastPerformance(sessions, exerciseId)` | Most recent **finished** session containing that exercise with ≥1 done set. Returns `{ date, daysAgo, sets }` or `null`. Keyed on exercise, *not* split — moving an exercise between templates preserves its history. |
| `prefillSets(lastPerf)` | Copies the last performance's weights and reps with `done: false`. **Never auto-increments.** Progression is the lifter's decision. |
| `e1rm(weight, reps)` | Epley: `weight × (1 + reps / 30)`. Requires `reps ≥ 1`. |
| `personalRecord(sessions, exerciseId)` | Done set with highest `e1rm`. Tie → heavier absolute weight wins. Returns the real set plus its date, so the UI shows `82.5 × 8`, not an abstract number. |
| `sessionVolume(session)` | `Σ weight × reps` over done sets only. |
| `rollingAverage(entries, 7)` | For each entry, the mean of all entries within the trailing 7 days inclusive. Used for the bodyweight trend line. |
| `nextSplit(sessions)` | Last finished session's split advanced cyclically `push → pull → legs → push`. No history ⇒ `push`. Follows reality without complaint if a split repeats. |
| `weekBounds(now)` | Monday 00:00 local through Sunday 23:59:59 local. |
| `weekAttendance(sessions, visits, now)` | Set of attended dates within the current week, and its size. |
| `daysSince(sessions, split)` | Whole days since the last finished session of that split. `null` if never. `> 7` triggers the ⚠ marker. |
| `attendedToday(sessions, visits, now)` | Finished session today **or** a `GymVisit` today. |
| `restRemaining(restStartedAt, restSeconds, now)` | `restSeconds − (now − restStartedAt)` in seconds, clamped to `≥ 0`. Returns `null` when no timer is running. |
| `topSetKg(session, exerciseId)` | Heaviest `weightKg` among that exercise's **done** sets in one session. This is the value plotted by the exercise chart. |

`daysAgo` and `daysSince` count **whole local calendar days**, not 24-hour spans: a session late last night is "1d ago" this morning, not "0d".

`lastPerformance` scans the `by-date` index in descending order and stops at the first match. At personal scale (a few hundred sessions per year) this is trivially fast; no cache. If it ever isn't, a memoized last-performance map is the fix — not now.

## 7. Screens

Four bottom tabs: **Today · Progress · Body · Settings**. The active-session screen is pushed from Today rather than being a tab, so it cannot be navigated away from by accident.

### 7.1 Today

The first thing visible answers "did I go today?".

```
TODAY · Sat Aug 1

┌──────────────────────────────┐
│  ○  Haven't trained today    │
│     Next up:  PULL           │
│                              │
│     [    Start Pull    ]     │
│     [ went, don't log ]      │
└──────────────────────────────┘

THIS WEEK                 4 / 6
  ● ● ● ● ○ ○
  Push 2d  ·  Pull 5d  ·  Legs 11d ⚠

  Runs this week: 1

  [ + run ]        [ + weight ]
```

- **Status card** flips once attended:
  `✓ Trained today — Push · 45 min · 4,120 kg volume`
- **Start Pull** is the primary action; the other two splits remain reachable one tap away — the rotation suggests, it does not gate.
- **"went, don't log"** writes a `GymVisit` for today. For sessions that happened but weren't logged.
- **Resume banner** appears above everything if an active session exists.
- **Week ring** fills toward `weeklyTarget` (6) and turns gold at or past target, so a 7-day week reads as a win, not an overflow. The dot row is capped at `weeklyTarget` dots; the numeric label shows the true count, so a seventh session displays as gold `7 / 6` with six filled dots rather than growing the row.
- **Days-since line** shows each split's gap; `> 7 days` gets ⚠. This is the legs-drift alarm.
- **`+ weight`** is emphasized when the last bodyweight entry is 8+ days old.

### 7.2 Active session

```
PUSH · started 18:04                    [ ✓ Finish ]

BENCH PRESS                 last time · 5d ago
                                     80 × 8,8,7
  Set 1    [− 80 +] kg   [− 8 +]        ✓
  Set 2    [− 80 +] kg   [− 8 +]        ✓
  Set 3    [− 80 +] kg   [− 7 +]        ○
                                   [ + set ]

INCLINE DB PRESS            last time · 5d ago
                                    30 × 10,10,9
  ...

                            [ + add exercise ]

┌──────────────────────────────┐
│  ⏱  1:47        +30s    Skip │
│  ████████████░░░░░░░░░░░░░░  │
└──────────────────────────────┘
```

- Opens pre-populated from the split's `Template`, each exercise prefilled via `prefillSets(lastPerformance(...))`. Exercises with no history start with one empty set.
- **Labels say "last time · Nd ago", never "last week."** With a rolling 4–6 day cycle, a fixed weekly label would be a lie.
- Weight and reps use **large `−` / `+` steppers**, stepping by the exercise's `incrementKg` and by 1 rep. Tapping the number itself opens a numeric keypad for a direct edit. Steppers mean the keyboard rarely appears.
- **✓ per set** marks it done and starts the rest timer. Un-checking does not touch the timer.
- Exercises can be added or skipped on the day; skipping simply leaves sets undone and is not recorded as a failure.
- The session persists on every mutation — closing the app mid-workout loses nothing.
- **Finish** sets `finishedAt`, clears the rest timer, and returns to Today with the status card flipped.

### 7.3 Progress

Segmented control with four views.

- **Recap** — most recent finished session per split, in full, with date, gap, duration and volume. "Last Push · 5 days ago".
- **Exercise** — pick an exercise: SVG line chart of `topSetKg` per session over time (heaviest done set that session), plus a reverse-chronological session list with PR markers.
- **PRs** — every exercise's best set and the date it happened, sorted by recency.
- **Calendar** — month grid marking each day `P` / `P` / `L`, `•` for a manual visit, `R` for a run, with a weekly total in the margin.

### 7.4 Body

- Bodyweight scatter of every entry plus the 7-day rolling-average line, current weight, and 4-week delta.
- Add / edit / delete entries. Multiple entries per week are allowed and desirable — the rolling average is what removes the noise.
- Run history below: date, distance, duration, derived pace (`durationSec / distanceKm`, shown `m:ss /km`).

### 7.5 Settings

- **Templates** — reorder, add and remove exercises per split.
- **Exercises** — name, `restSeconds`, `incrementKg`, archive.
- **Export backup** / **Import backup**, with `Last backup: N days ago` shown in amber past 30 days.
- Unit toggle, weekly target, rest beep on/off.

## 8. Rest timer

- **Auto-starts** when a set is marked done: `restStartedAt = now`, `restSeconds = exercise.restSeconds`.
- **Remaining time is always computed from the stored timestamp**, never by decrementing a counter. `setTimeout` and intervals freeze when iOS backgrounds the app or the screen locks; timestamp arithmetic survives being pocketed mid-rest and returns the correct value. The UI re-renders on a 250 ms tick purely for display.
- `+30s` adds to `restSeconds`. `Skip` sets `restStartedAt = null`.
- **Beep** on crossing zero, synthesized by a Web Audio oscillator — no audio asset, works offline. iOS requires the `AudioContext` be created and resumed inside a real user gesture, so it is unlocked on the tap that starts the session. If the app was backgrounded through zero, no beep fires on return: a late beep is worse than none. Muteable via `restBeepEnabled`.
- `navigator.vibrate` does not exist on iOS Safari. No haptics; the visible bar plus the beep is what is actually achievable.
- The bar is pinned above the tab bar so it stays visible while scrolling the exercise list.

## 9. Backup and restore

**Export** produces one JSON file:

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-08-01T18:40:00.000Z",
  "exercises": [], "templates": [], "sessions": [],
  "bodyweights": [], "runs": [], "visits": [], "settings": {}
}
```

Delivered via a download anchor, which on iOS routes into **Save to Files** (iCloud Drive). Writes `settings.lastBackupAt`.

**Import** is **replace-all**, behind an explicit confirmation naming the file's date and record counts. Merge semantics are where restore bugs live; for a single user restoring their own device, replace-all is the honest operation. `schemaVersion` is validated and a mismatch is refused rather than guessed at.

## 10. PWA and iOS specifics

These are the difference between a website and something that feels like an app:

- Manifest `display: standalone`, `theme_color` matching the app background, icons at 192/512 plus a 180 px `apple-touch-icon`.
- `viewport-fit=cover` with `env(safe-area-inset-bottom)` padding, so the tab bar sits above the home indicator rather than under it.
- **Inputs at ≥16 px font**, otherwise iOS zooms the viewport on every focus.
- `touch-action: manipulation` to kill double-tap zoom and the 300 ms tap delay; `overscroll-behavior: none` to stop rubber-banding.
- `user-select: none` on controls, so long-pressing a stepper doesn't select text.
- Service worker precaches the shell — the app opens with zero connectivity.
- **Screen Wake Lock** requested while a session is active, released on finish, so the phone doesn't sleep between sets.
- Dark palette only, high contrast, tap targets ≥ 44 px.

## 11. Testing

Vitest over `src/logic/` and the export/import round trip. Roughly seventeen tests, written test-first:

1. `e1rm` — known values; rejects `reps < 1`
2. `personalRecord` — picks highest e1rm; tie broken by heavier weight; ignores undone sets; `null` on no history
3. `lastPerformance` — finds most recent finished session; **skips the active session**; skips sessions where the exercise has no done sets; correct `daysAgo`
4. `lastPerformance` across splits — an exercise moved from Push to Pull still finds its history
5. `prefillSets` — copies weights/reps, sets `done: false`, does not increment
6. `sessionVolume` — done sets only
7. `rollingAverage` — 7-day trailing window, sparse dates, single entry
8. `nextSplit` — cycles correctly; `push` on empty history; follows a repeated split without correcting it
9. `weekBounds` — Monday start; correct across a month boundary
10. `weekAttendance` — counts finished sessions and manual visits; a session and a visit on the same day count once
11. `daysSince` — per split; `null` when never; boundary at exactly 7 days
12. `attendedToday` — session only, visit only, neither
13. Rest-timer remaining — computed from timestamp; clamps at 0; unaffected by a simulated background gap
14. `topSetKg` — heaviest done set; ignores undone sets; `null` when the exercise is absent
15. Unit conversion — kg↔lb round-trips at display precision; storage is untouched by the toggle
16. Export → import round trip — byte-identical record sets
17. Import — refuses a mismatched `schemaVersion`

No E2E, no CI. UI verification is manual, on the actual phone, which is also the only device it must work on.

## 12. Build phases

Each phase ends in something usable.

1. **Foundation** — Vite + React + TS scaffold, dark shell, four empty tabs, IndexedDB schema and repository, settings, export/import. *Done when:* a backup round-trips through the UI.
2. **Templates** — exercise CRUD, the three template editors, seeded with the author's real PPL exercises and rest times. *Done when:* all three templates reflect the actual routine.
3. **Session logging + rest timer** — a *minimal* Today tab (three split buttons, next-up suggestion, resume banner) plus the active-session screen: prefill, steppers, per-set ✓, rest bar, finish. *Done when:* a full Push workout can be logged end to end with almost no typing.
4. **Deploy and install** — Vercel, manifest, service worker, icons, home-screen install, offline verification in airplane mode. *Done when:* a real workout is logged on the phone, offline.
5. **Today tab, complete** — attendance status card, week ring, days-since line with ⚠, manual gym visit, run and weight quick-adds.
6. **Body** — bodyweight entry, chart with rolling average, 4-week delta; run entry and history with pace.
7. **Progress** — recap, exercise chart, PR list, calendar.
8. **Polish** — wake lock, backup-age nudge, empty states, transitions.

Phase 4 sits deliberately in the middle: the app goes on the phone as soon as the core loop works, so the remaining phases are shaped by real use rather than guesses.

## 13. Defaults chosen

| Decision | Value | Rationale |
|---|---|---|
| Unit | kg | Author's unit; toggleable for display only — storage is always kg |
| Weekly target | 6 | Stated goal; editable |
| Week start | Monday | Matches how the week is counted |
| Theme | dark only | Gym app, single user, no toggle worth maintaining |
| Progression | manual | Prefill shows last time; the lifter decides the jump |
| Default rest | 180 s compound / 90 s accessory | Set per exercise at seed time |
| PR definition | best estimated 1RM (Epley) | Comparable across rep ranges; displayed as the real set |
| Attendance | derived, plus manual visits | One source of truth, with an escape hatch |
| Runs vs gym | separate | Runs happen outside; they should not inflate gym attendance |

## 14. Risks

| Risk | Mitigation |
|---|---|
| Safari data eviction | Home-screen install exempts the origin; export backup is the real answer |
| No sync — device loss is data loss | One-tap export, amber nudge past 30 days |
| Origin change wipes the app | URL is permanent and documented; never re-deploy under a new domain |
| Logging friction kills the habit | Steppers over keyboards, prefill from last time, auto rest timer, ≤2 taps per set |
| Rolling schedule makes "last week" meaningless | Every comparison shows the real gap in days |
