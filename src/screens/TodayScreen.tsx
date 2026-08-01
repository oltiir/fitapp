import { useState } from 'react'
import { useStore } from '../store/StoreContext'
import WeekRing from '../components/WeekRing'
import QuickAddRun from '../components/QuickAddRun'
import QuickAddWeight from '../components/QuickAddWeight'
import { unlockAudio } from '../lib/audio'
import { newId } from '../logic/id'
import { daysBetween, toISODate, todayISO, weekBounds } from '../logic/dates'
import { activeSession, finishedSessions, lastPerformance } from '../logic/history'
import { attendedToday, daysSinceAll, nextSplit, STALE_SPLIT_DAYS, weekAttendance } from '../logic/attendance'
import { emptySet, prefillSets, sessionVolume } from '../logic/sets'
import { formatDuration, toDisplayWeight } from '../logic/units'
import { SPLITS, SPLIT_LABEL, type Session, type Split } from '../types'

const SPLIT_INITIAL: Record<Split, string> = { push: 'P', pull: 'P', legs: 'L' }

export default function TodayScreen({
  onOpenSession,
  onGoToSettings,
}: {
  onOpenSession: (sessionId: string) => void
  onGoToSettings: () => void
}) {
  const { data, beginSession, saveVisit, removeVisit } = useStore()
  const [addingRun, setAddingRun] = useState(false)
  const [addingWeight, setAddingWeight] = useState(false)

  const now = new Date()
  const today = todayISO(now)
  const { settings } = data

  const active = activeSession(data.sessions)
  const suggested = nextSplit(data.sessions)
  const attended = attendedToday(data.sessions, data.visits, now)
  const week = weekAttendance(data.sessions, data.visits, now)
  const since = daysSinceAll(data.sessions, today)

  const todaysSession = finishedSessions(data.sessions).find((s) => s.date === today)
  const { start: weekStart, end: weekEnd } = weekBounds(now)
  const runsThisWeek = data.runs.filter((r) => r.date >= weekStart && r.date <= weekEnd).length

  const latestWeighIn = data.bodyweights
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .pop()
  const weighInDue =
    latestWeighIn === undefined || daysBetween(latestWeighIn.date, today) >= 8

  const backupAgeDays =
    settings.lastBackupAt === null
      ? null
      : daysBetween(toISODate(new Date(settings.lastBackupAt)), today)
  const backupStale = backupAgeDays === null || backupAgeDays > 30

  async function startSplit(split: Split) {
    // Unlock audio on this real user gesture — iOS will not start an AudioContext
    // later, when the rest timer actually wants to beep.
    unlockAudio()

    const template = data.templates.find((t) => t.split === split)
    const entries = (template?.exerciseIds ?? []).map((exerciseId) => {
      const last = lastPerformance(data.sessions, exerciseId, today)
      return { exerciseId, sets: last ? prefillSets(last.sets) : [emptySet()] }
    })

    const session: Session = {
      id: newId(),
      split,
      date: today,
      startedAt: now.toISOString(),
      finishedAt: null,
      entries,
      restStartedAt: null,
      restSeconds: null,
    }
    await beginSession(session)
    onOpenSession(session.id)
  }

  const volumeLabel = (s: Session) => {
    const kg = sessionVolume(s)
    return `${Math.round(toDisplayWeight(kg, settings.unit)).toLocaleString()} ${settings.unit}`
  }

  const durationLabel = (s: Session) =>
    s.finishedAt
      ? formatDuration((new Date(s.finishedAt).getTime() - new Date(s.startedAt).getTime()) / 1000)
      : '—'

  return (
    <div className="screen">
      <h1>
        {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
      </h1>

      {active && (
        <div className="card status-card attended">
          <div className="spread">
            <div>
              <strong>In progress — {SPLIT_LABEL[active.split]}</strong>
              <div className="sub">
                Started{' '}
                {new Date(active.startedAt).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => onOpenSession(active.id)}>
              Resume
            </button>
          </div>
        </div>
      )}

      <div className={`card status-card${attended ? ' attended' : ''}`}>
        {attended ? (
          todaysSession ? (
            <>
              <div>
                <span className="status-icon">✓</span>
                <strong>Trained today — {SPLIT_LABEL[todaysSession.split]}</strong>
              </div>
              <div className="sub mono" style={{ marginTop: 4 }}>
                {durationLabel(todaysSession)} · {volumeLabel(todaysSession)} volume
              </div>
            </>
          ) : (
            <div className="spread">
              <div>
                <span className="status-icon">✓</span>
                <strong>Marked as a gym visit</strong>
              </div>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => void removeVisit(today)}
              >
                undo
              </button>
            </div>
          )
        ) : (
          <>
            <div>
              <span className="status-icon">○</span>
              <strong>Haven’t trained today</strong>
            </div>
            <div className="sub" style={{ marginTop: 8 }}>
              Next up
            </div>
            <strong style={{ fontSize: 20 }}>{SPLIT_LABEL[suggested].toUpperCase()}</strong>
          </>
        )}

        {!active && (
          <>
            <button
              className="btn btn-primary"
              style={{ marginTop: 12 }}
              onClick={() => void startSplit(suggested)}
            >
              Start {SPLIT_LABEL[suggested]}
            </button>
            <div className="btn-grid" style={{ marginTop: 10 }}>
              {SPLITS.filter((s) => s !== suggested).map((s) => (
                <button key={s} className="btn" onClick={() => void startSplit(s)}>
                  {SPLIT_LABEL[s]}
                </button>
              ))}
            </div>
            {!attended && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 10, width: '100%' }}
                onClick={() => void saveVisit({ date: today })}
              >
                went, don’t log
              </button>
            )}
          </>
        )}
      </div>

      <h2>This week</h2>
      <div className="card">
        <WeekRing count={week.count} target={settings.weeklyTarget} />
        <div className="sub mono" style={{ marginTop: 6, letterSpacing: '0.35em' }}>
          {week.dates
            .map((d) => (week.splitsByDate[d] ?? []).map((s) => SPLIT_INITIAL[s]).join('') || '•')
            .join(' ') || '—'}
        </div>

        <div className="since">
          {SPLITS.map((s) => {
            const days = since[s]
            const stale = days !== null && days > STALE_SPLIT_DAYS
            return (
              <span key={s} className={stale ? 'stale' : undefined}>
                {SPLIT_LABEL[s]} {days === null ? '—' : `${days}d`}
                {stale ? ' ⚠' : ''}
              </span>
            )
          })}
        </div>

        <div className="sub" style={{ marginTop: 10 }}>
          Runs this week: {runsThisWeek}
        </div>
      </div>

      <div className="btn-grid">
        <button className="btn" onClick={() => setAddingRun(true)}>
          + run
        </button>
        <button
          className={`btn${weighInDue ? ' btn-primary' : ''}`}
          onClick={() => setAddingWeight(true)}
        >
          + weight
        </button>
      </div>

      {backupStale && (
        <div className="card nudge" style={{ marginTop: 12 }}>
          <span>
            ⚠ Last backup {backupAgeDays === null ? 'never' : `${backupAgeDays} days ago`} — this is
            the only copy of your data.
          </span>
          <button className="btn btn-sm" onClick={onGoToSettings}>
            Back up
          </button>
        </div>
      )}

      {addingRun && <QuickAddRun onClose={() => setAddingRun(false)} />}
      {addingWeight && <QuickAddWeight onClose={() => setAddingWeight(false)} />}
    </div>
  )
}
