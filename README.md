# FitApp

A personal Push/Pull/Legs training log, built to be installed on an iPhone home screen and used as an app. Single user, no accounts, no server, fully offline.

- **Today** — did I train today, am I on pace for my weekly target, which split is next, days since each split, quick-add for runs and bodyweight
- **Session** — per-set logging prefilled from last time, big steppers so the keyboard rarely opens, automatic rest timer per exercise
- **Progress** — last-session recaps, per-exercise charts, PR list, consistency calendar
- **Body** — bodyweight with a 7-day rolling average and 4-week delta, run history with pace
- **Settings** — edit the three templates and the exercise list, export/import a backup

## Read this before you rely on it

**Your data lives only in this browser's IndexedDB, on this one device.** There is no server copy and no sync. Three consequences:

1. **Launch it from the home-screen icon, not a Safari tab.** iOS clears site data for origins you haven't visited in about a week. Home-screen-installed PWAs are exempt; a bookmark in Safari is not.
2. **An export is your only backup.** Settings → *Export backup* writes a JSON file; on iOS choose *Save to Files* to put it in iCloud Drive. The Today tab nags you when the last backup is over 30 days old. *Import backup* replaces everything currently in the app.
3. **This URL must never change:**

   ## → https://oltiir.github.io/fitapp/

   IndexedDB is scoped per origin, so serving the app from a different domain or path gives you an empty app with none of your history.

## Deploying

Deployed to **GitHub Pages** at https://oltiir.github.io/fitapp/. `.github/workflows/deploy.yml` runs the test suite and builds with `VITE_BASE=/fitapp/` on every push to `main`; Pages is configured with *Source: GitHub Actions*. The repository is public because Pages on a private repo requires a paid plan — the code is public, your training data is not: it never leaves your phone.

`vercel.json` is also committed if you ever want to move to Vercel instead. If you do, remember that the origin changes, so export a backup first and import it on the new URL.

Either way it must be HTTPS — the service worker that makes the app work offline will not register otherwise.

## Installing on the iPhone

1. Open the deployed URL in Safari.
2. Share → **Add to Home Screen**.
3. Launch from the icon. There should be no browser chrome, and the tab bar should sit above the home indicator.
4. Turn on Airplane Mode and relaunch to confirm it works with no connection.

## Development

```bash
npm install
npm run dev          # dev server
npm test             # unit + integration tests
npm run typecheck    # tsc
npm run build        # production build into dist/
```

## How it's put together

Three layers, strictly separated:

| Path | Responsibility |
| --- | --- |
| `src/db/` | IndexedDB schema and typed CRUD. Knows record shapes, nothing about training. |
| `src/logic/` | Pure functions over records — PRs, rolling averages, rotation, attendance. No I/O, no React. Everything here is unit tested. |
| `src/screens/`, `src/components/` | Rendering and input. No domain rules. |

Anything that *computes* something belongs in `src/logic/`, never inline in a component — that is what keeps it testable.

Two conventions worth knowing before editing:

- **Weights are always stored in kilograms.** The `kg`/`lb` setting is display-only, converted at the render and input boundary. Every stored weight field is named with a `Kg` suffix as a reminder.
- **Dates are local calendar days** (`'YYYY-MM-DD'`). Never `new Date('2026-08-01')` — that parses as UTC and shifts the day. Use `parseISODate` from `src/logic/dates.ts`.

Design notes and the implementation plan are in `docs/superpowers/`.
