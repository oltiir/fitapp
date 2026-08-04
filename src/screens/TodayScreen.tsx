import { useState } from 'react'
import { useStore } from '../store/StoreContext'
import BeltStrip from '../components/BeltStrip'
import QuickAddRun from '../components/QuickAddRun'
import QuickAddWeight from '../components/QuickAddWeight'
import Icon from '../components/Icon'
import { unlockAudio } from '../lib/audio'
import { newId } from '../logic/id'
import { daysBetween, toISODate, todayISO, weekBounds } from '../logic/dates'
import { activeSession, finishedSessions, lastPerformance, recordsSetIn } from '../logic/history'
import {
  attendedToday,
  daysSinceAll,
  nextSplit,
  STALE_SPLIT_DAYS,
  weekAttendance,
} from '../logic/attendance'
import { emptySet, prefillSets, sessionVolume } from '../logic/sets'
import { formatDaysAgo, formatDuration, toDisplayWeight } from '../logic/units'
import { SPLITS, SPLIT_LABEL, type Session, type Split } from '../types'

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
  const unit = settings.unit

  const active = activeSession(data.sessions)
  const suggested = nextSplit(data.sessions)
  const attended = attendedToday(data.sessions, data.visits, now)
  const week = weekAttendance(data.sessions, data.visits, now)
  const since = daysSinceAll(data.sessions, today)

  const finished = finishedSessions(data.sessions)
  const todaysSession = finished.find((s) => s.date === today)
  const { start: weekStart, end: weekEnd } = weekBounds(now)
  const runsThisWeek = data.runs.filter((r) => r.date >= weekStart && r.date <= weekEnd).length
  const runDates = new Set(data.runs.map((r) => r.date))

  const latestWeighIn = data.bodyweights
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .pop()
  const weighInDue = latestWeighIn === undefined || daysBetween(latestWeighIn.date, today) >= 8

  const backupAgeDays =
    settings.lastBackupAt === null
      ? null
      : daysBetween(toISODate(new Date(settings.lastBackupAt)), today)
  // Nothing logged yet means nothing to lose — nagging about backups on a fresh
  // install is pure noise.
  const hasData =
    data.sessions.length > 0 || data.bodyweights.length > 0 || data.runs.length > 0
  const backupStale = hasData && (backupAgeDays === null || backupAgeDays > 30)

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

  const volumeOf = (s: Session) =>
    `${Math.round(toDisplayWeight(sessionVolume(s), unit)).toLocaleString()} ${unit}`

  const durationOf = (s: Session) =>
    s.finishedAt
      ? formatDuration((new Date(s.finishedAt).getTime() - new Date(s.startedAt).getTime()) / 1000)
      : '—'

  // The app's opinion, in one line under the split name. Facts only: how long
  // since, what was moved, and whether today beat the last time out.
  const lastOfSuggested = finished.find((s) => s.split === suggested)
  const prsToday = todaysSession ? recordsSetIn(data.sessions, todaysSession.id) : []
  const previousSameSplit = todaysSession
    ? finished.filter((s) => s.split === todaysSession.split)[1]
    : undefined
  const volumeDelta =
    todaysSession && previousSameSplit
      ? sessionVolume(todaysSession) - sessionVolume(previousSameSplit)
      : null

  return (
    <div className="screen">
      <header className="rail">
        <span className="where">
          {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
        <span className="when">
          {finished.length} {finished.length === 1 ? 'session' : 'sessions'} logged
        </span>
      </header>

      {active && (
        <div className="band-notice live">
          <Icon name="timer" size={26} />
          <div className="txt">
            <div className="hd">In progress — {SPLIT_LABEL[active.split]}</div>
            <div className="sub">
              Started{' '}
              {new Date(active.startedAt).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
          <button className="steel-btn sm" onClick={() => onOpenSession(active.id)}>
            Resume
          </button>
        </div>
      )}

      {/* No label above the heading. The split is the heading; its state reads on
          the line underneath, which is where a fact belongs anyway. */}
      <div className="plate">
        {attended ? (
          todaysSession ? (
            <>
              <h1 className="split">{SPLIT_LABEL[todaysSession.split].toUpperCase()}</h1>
              <div className="facts">
                <strong>Trained today</strong>
                <span>{durationOf(todaysSession)}</span>
                <span>{volumeOf(todaysSession)} volume</span>
                {volumeDelta !== null && volumeDelta > 0 && (
                  <span>
                    +{Math.round(toDisplayWeight(volumeDelta, unit)).toLocaleString()} {unit} on last
                    time
                  </span>
                )}
                {prsToday.length > 0 && (
                  <span className="stamp">
                    <Icon name="up" size={12} strokeWidth={2.6} />
                    {prsToday.length} new {prsToday.length === 1 ? 'record' : 'records'}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <h1 className="split">{SPLIT_LABEL[suggested].toUpperCase()}</h1>
              <div className="facts">
                <strong>Marked as a gym visit</strong>
                <span>Nothing logged — the day still counts towards the week.</span>
                <button
                  className="quiet"
                  style={{ width: 'auto' }}
                  onClick={() => void removeVisit(today)}
                >
                  undo
                </button>
              </div>
            </>
          )
        ) : (
          <>
            <h1 className="split">{SPLIT_LABEL[suggested].toUpperCase()}</h1>
            {/* One fact, not a relocated label: "Next up" on its own lost its
                object when the eyebrow above the heading was deleted. */}
            <div className="facts">
              <strong>Haven’t trained today</strong>
              {lastOfSuggested ? (
                <span>
                  {SPLIT_LABEL[suggested]} is next — last trained{' '}
                  {formatDaysAgo(daysBetween(lastOfSuggested.date, today))},{' '}
                  {volumeOf(lastOfSuggested)}
                </span>
              ) : (
                <span>{SPLIT_LABEL[suggested]} is next — never trained</span>
              )}
            </div>
          </>
        )}
      </div>

      {!active && (
        <>
          <button className="buckle" onClick={() => void startSplit(suggested)}>
            <span className="stitch" aria-hidden="true" />
            Start {SPLIT_LABEL[suggested]}
          </button>
          {!attended && (
            <button className="quiet" onClick={() => void saveVisit({ date: today })}>
              went, don’t log
            </button>
          )}
        </>
      )}

      <h2 className="rule">This week</h2>
      <BeltStrip now={now} week={week} runDates={runDates} target={settings.weeklyTarget} today={today} />

      {/* Each tag reports how long since that split and starts it. One control
          doing both jobs beats a status line plus a separate button. */}
      <div className="tags">
        {SPLITS.map((s) => {
          const days = since[s]
          const stale = days !== null && days > STALE_SPLIT_DAYS
          const ago = days === null ? 'never trained' : days === 0 ? 'today' : `${days} days ago`
          return (
            <button
              key={s}
              className={`tag${s === suggested ? ' next' : ''}${stale ? ' stale' : ''}`}
              aria-label={`Start ${SPLIT_LABEL[s]} — ${ago}`}
              onClick={() => void startSplit(s)}
            >
              <span className="nm">{SPLIT_LABEL[s]}</span>
              <span className="ago">
                {days === null ? '—' : days}
                {days === null ? null : <span className="u">d</span>}
              </span>
            </button>
          )
        })}
      </div>

      <h2 className="rule">
        <span>Log</span>
        <span className="val">Runs this week: {runsThisWeek}</span>
      </h2>
      <div className="btn-pair">
        {/* The label never changes — a control that renames itself is harder to
            find than one that adds a marker. Due-ness is a dot, not new copy. */}
        <button className="steel-btn" aria-label="+ weight" onClick={() => setAddingWeight(true)}>
          <Icon name="plate" size={20} />+ weight
          {weighInDue && <span className="due-dot" aria-hidden="true" />}
        </button>
        <button className="steel-btn" onClick={() => setAddingRun(true)}>
          <Icon name="road" size={20} />+ run
        </button>
      </div>

      {backupStale && (
        <div className="hazard" style={{ marginTop: 'var(--s4)' }}>
          <div className="stripe" />
          <div className="inner">
            <Icon name="warn" size={24} />
            <div className="txt">
              <div className="hd">
                Last backup {backupAgeDays === null ? 'never' : `${backupAgeDays} days ago`}
              </div>
              <div className="sub">This device holds the only copy of your training history.</div>
            </div>
            <button className="steel-btn sm" onClick={onGoToSettings}>
              Back up
            </button>
          </div>
        </div>
      )}

      {addingRun && <QuickAddRun onClose={() => setAddingRun(false)} />}
      {addingWeight && <QuickAddWeight onClose={() => setAddingWeight(false)} />}
    </div>
  )
}
