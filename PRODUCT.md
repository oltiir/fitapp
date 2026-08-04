# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One user: the owner, training a Push/Pull/Legs split with a weekly session target
(default 6). No accounts, no second user, no sharing, no coach reading the data.

Two distinct scenes, both real:

1. **In the gym**, phone in one hand, standing or sitting between sets, glancing at
   the screen for a few seconds at arm's length, sometimes with sweaty or chalked
   hands. This scene wins every trade-off.
2. **On the couch afterwards**, browsing what happened and whether it is adding up.

## Product Purpose

Record every working set of a PPL routine, plus bodyweight and runs, and turn that
record into visible evidence of getting stronger. Success is (a) logging a set
costs almost nothing mid-workout, and (b) the user opens the app between workouts
because the payoff screens are worth looking at.

## Positioning

A single-user, offline-first, no-account training log that owns its data outright:
everything lives in this device's IndexedDB, there is no server and no sync, and a
JSON export is the only backup. Nothing to sign into, nothing uploaded, no
subscription, no social layer.

## Operating Context

- Installed to the iPhone home screen as a PWA and launched from the icon, not a
  Safari tab (iOS evicts site data for origins unvisited for ~7 days; installed
  PWAs are exempt). Runs with no browser chrome, must respect safe-area insets
  top and bottom.
- Must work fully offline; a service worker serves the shell.
- The origin is load-bearing: `https://oltiir.github.io/fitapp/`. IndexedDB is
  scoped per origin, so moving the URL orphans all history.
- Deployed by GitHub Actions on push to `main`; the repo is public, the data is not.
- Session flow in the gym: open app → start the suggested split → for each
  exercise, adjust weight/reps from last time's prefill → mark set done → rest
  timer runs → repeat → finish.

## Capabilities and Constraints

Confirmed functionality that must survive any redesign:

- **Today:** trained-today status, week progress against the weekly target, which
  split is suggested next, days since each split with a staleness warning, start a
  session, mark a gym visit without logging ("went, don't log"), resume an
  unfinished session, quick-add run and bodyweight, stale-backup nag after 30 days.
- **Session:** one screen for the whole workout, one row per exercise with only the
  current one expanded; sets prefill from the last performance of that exercise;
  weight/reps steppers with per-exercise increments; per-exercise rest duration
  that is remembered when changed; inline rest countdown with −30s/skip/+30s and an
  end-of-rest beep; add/remove exercise mid-workout; add extra sets; undo a logged
  set; finish or discard; screen wake lock held while a session is open.
- **Progress:** per-split recap of the last session, per-exercise history chart,
  PR list, month consistency calendar.
- **Body:** bodyweight with 7-day rolling average and 4-week delta, run log with
  pace, delete individual entries.
- **Settings:** edit the three split templates and the exercise list, kg/lb toggle,
  weekly target, rest beep toggle, export/import backup, reset all data.

Technical constraints:

- React 19 + Vite + TypeScript, no UI framework, no CSS library, hand-written CSS.
- Charts are hand-rolled inline SVG; no charting dependency.
- Three strict layers: `src/db/` (IndexedDB), `src/logic/` (pure, unit-tested,
  owns every computation), `src/screens/` + `src/components/` (render and input
  only). Anything that computes belongs in `logic/`.
- Weights are stored in kilograms always; kg/lb is a display-only conversion at the
  render and input boundary. Stored weight fields carry a `Kg` suffix.
- Dates are local calendar days as `'YYYY-MM-DD'`; never `new Date(iso)` on a date
  string (parses as UTC and shifts the day) — use `parseISODate`.
- Everything must stay usable with one thumb; touch targets ≥44px.
- Bundle stays small enough to install and boot instantly offline on a phone.

## Brand Commitments

Name: **FitApp**. No logo, wordmark, palette, or typeface has been committed —
the existing look is incumbent evidence, not a brand commitment.

## Evidence on Hand

- Real training data in the owner's device IndexedDB; the repo ships a seeded PPL
  routine (`src/logic/seed.ts`) for a fresh install.
- Existing icon set in `public/` and `assets/icon.svg`.
- No testimonials, customers, benchmarks, pricing, or third-party claims exist.
  Future work must not invent any.

## Product Principles

1. **The gym scene wins ties.** When one-handed, arm's-length, mid-set usability
   conflicts with anything else — density, elegance, feature depth — the gym wins.
2. **Logging a set is the primary action of the whole product.** Every screen is
   judged by how little it gets in the way of that.
3. **The app has an opinion.** It compares today to last time, names PRs, shows
   momentum, and flags a stale split. It reports facts with feeling, but never
   fabricates encouragement or guilt-trips the user.
4. **Prefill over input.** The app should already know what the user is about to
   do; the interaction is confirming or nudging a number, not entering one.
5. **The data is the user's and only the user's.** Offline-first, origin-stable,
   export-honest. No feature may imply a server, an account, or sync.

## Accessibility & Inclusion

Touch targets ≥44px (already enforced). Must remain legible at arm's length in
bright gym lighting, and readable with iOS text-size adjustment. Colour is never
the sole carrier of state (done/PR/stale all need a second cue).
