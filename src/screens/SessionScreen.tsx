import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/StoreContext'
import Stepper from '../components/Stepper'
import Sheet from '../components/Sheet'
import Icon from '../components/Icon'
import { beep } from '../lib/audio'
import { useWakeLock } from '../hooks/useWakeLock'
import { useTicker } from '../hooks/useTicker'
import { emptySet } from '../logic/sets'
import { lastPerformance } from '../logic/history'
import { restJustFinished, restRemaining } from '../logic/rest'
import { todayISO } from '../logic/dates'
import {
  formatDaysAgo,
  formatDuration,
  formatSetSummary,
  fromDisplayWeight,
  toDisplayWeight,
} from '../logic/units'
import { SPLIT_LABEL, type SetEntry, type Session } from '../types'

/** Offered by the rest picker. Chosen once, then remembered on the exercise. */
const REST_CHOICES = [45, 60, 90, 120, 150, 180]

export default function SessionScreen({
  sessionId,
  onExit,
}: {
  sessionId: string
  onExit: () => void
}) {
  const { data, saveSession, saveExercise, removeSession } = useStore()
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [pickingRest, setPickingRest] = useState(false)
  const [punched, setPunched] = useState<string | null>(null)
  const punchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openRef = useRef<HTMLDivElement | null>(null)
  const session = data.sessions.find((s) => s.id === sessionId)

  useWakeLock(session !== undefined)
  useTicker(1000, session !== undefined) // elapsed clock + rest countdown

  useEffect(() => {
    if (!session) onExit()
  }, [session, onExit])

  useEffect(
    () => () => {
      if (punchTimer.current) clearTimeout(punchTimer.current)
    },
    [],
  )

  // Bring the exercise you just opened up next to the dock, so its steppers and
  // the commit bar are on screen together without a scroll.
  useEffect(() => {
    const el = openRef.current
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [openId])

  // Clear a rest left running from a session resumed hours later. On open only:
  // clearing continuously would yank the timer away seconds after a real rest.
  const stale =
    session?.restStartedAt != null &&
    session.restSeconds != null &&
    (Date.now() - new Date(session.restStartedAt).getTime()) / 1000 > session.restSeconds + 300
  useEffect(() => {
    if (session && stale) void saveSession({ ...session, restStartedAt: null, restSeconds: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  if (!session) return null

  const unit = data.settings.unit
  const today = todayISO(new Date())
  const now = new Date()

  const exerciseOf = (id: string) => data.exercises.find((e) => e.id === id)
  const nameOf = (id: string) => exerciseOf(id)?.name ?? id

  const patch = (next: Session) => void saveSession(next)

  // The exercise you are on: the first with an unfinished set, unless you picked one.
  const firstUnfinished = session.entries.find((e) => e.sets.some((s) => !s.done))?.exerciseId
  const activeId = openId ?? firstUnfinished ?? session.entries[0]?.exerciseId ?? null

  const setSets = (exerciseId: string, sets: SetEntry[]) =>
    patch({
      ...session,
      entries: session.entries.map((e) => (e.exerciseId === exerciseId ? { ...e, sets } : e)),
    })

  const editSet = (exerciseId: string, i: number, changes: Partial<SetEntry>) => {
    const entry = session.entries.find((e) => e.exerciseId === exerciseId)
    if (!entry) return
    setSets(
      exerciseId,
      entry.sets.map((s, j) => (j === i ? { ...s, ...changes } : s)),
    )
  }

  /** Complete the current set and start this exercise's rest. */
  const completeSet = (exerciseId: string, i: number) => {
    const entry = session.entries.find((e) => e.exerciseId === exerciseId)
    if (!entry) return
    patch({
      ...session,
      entries: session.entries.map((e) =>
        e.exerciseId !== exerciseId
          ? e
          : { ...e, sets: e.sets.map((s, j) => (j === i ? { ...s, done: true } : s)) },
      ),
      restStartedAt: new Date().toISOString(),
      restSeconds: exerciseOf(exerciseId)?.restSeconds ?? 60,
    })
    setOpenId(exerciseId)
    // The punch: the one authored motion in the app.
    setPunched(`${exerciseId}:${i}`)
    if (punchTimer.current) clearTimeout(punchTimer.current)
    punchTimer.current = setTimeout(() => setPunched(null), 480)
  }

  const undoSet = (exerciseId: string, i: number) => editSet(exerciseId, i, { done: false })

  const addSet = (exerciseId: string) => {
    const entry = session.entries.find((e) => e.exerciseId === exerciseId)
    if (!entry) return
    const last = entry.sets[entry.sets.length - 1]
    setSets(exerciseId, [
      ...entry.sets,
      last ? { weightKg: last.weightKg, reps: last.reps, done: false } : emptySet(),
    ])
  }

  const chooseRest = (exerciseId: string, seconds: number) => {
    const ex = exerciseOf(exerciseId)
    if (!ex) return
    void saveExercise({ ...ex, restSeconds: seconds })
    setPickingRest(false)
  }

  const addExercise = (exerciseId: string) => {
    const last = lastPerformance(data.sessions, exerciseId, today)
    patch({
      ...session,
      entries: [
        ...session.entries,
        {
          exerciseId,
          sets: last
            ? last.sets.map((s) => ({ weightKg: s.weightKg, reps: s.reps, done: false }))
            : [emptySet()],
        },
      ],
    })
    setOpenId(exerciseId)
    setAdding(false)
  }

  const dropExercise = (exerciseId: string) => {
    const entry = session.entries.find((e) => e.exerciseId === exerciseId)
    const logged = entry?.sets.filter((s) => s.done).length ?? 0
    if (
      logged > 0 &&
      !confirm(`Remove ${nameOf(exerciseId)}? ${logged} logged set(s) will be lost.`)
    )
      return
    patch({ ...session, entries: session.entries.filter((e) => e.exerciseId !== exerciseId) })
  }

  const finish = () => {
    const logged = session.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
    if (logged === 0 && !confirm('Nothing is logged yet. Finish anyway?')) return
    patch({
      ...session,
      finishedAt: new Date().toISOString(),
      restStartedAt: null,
      restSeconds: null,
    })
    onExit()
  }

  const discard = () => {
    if (!confirm('Discard this workout? Everything logged in it is lost.')) return
    void removeSession(session.id)
    onExit()
  }

  // --- rest timer, rendered in the dock so nothing shifts when it starts ---
  const remaining = restRemaining(session.restStartedAt, session.restSeconds, now)
  const justFinished = restJustFinished(session.restStartedAt, session.restSeconds, now)
  useEffect(() => {
    if (justFinished && data.settings.restBeepEnabled) beep()
    // Keyed on the rest's start stamp so each rest announces itself exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.restStartedAt, justFinished])

  const bumpRest = (delta: number) =>
    patch({ ...session, restSeconds: Math.max(5, (session.restSeconds ?? 60) + delta) })
  const skipRest = () => patch({ ...session, restStartedAt: null, restSeconds: null })

  const elapsed = formatDuration((now.getTime() - new Date(session.startedAt).getTime()) / 1000)

  const addable = data.exercises
    .filter((e) => !e.archived && !session.entries.some((x) => x.exerciseId === e.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  const totalSets = session.entries.reduce((n, e) => n + e.sets.length, 0)
  const doneSets = session.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)

  // Everything the dock needs about the exercise you are on.
  const activeEntry = session.entries.find((e) => e.exerciseId === activeId)
  const activeCurIndex = activeEntry?.sets.findIndex((s) => !s.done) ?? -1
  const activeCur = activeCurIndex === -1 ? null : activeEntry?.sets[activeCurIndex] ?? null
  const nextUnfinished = activeEntry
    ? (session.entries.slice(session.entries.indexOf(activeEntry) + 1).find((e) =>
        e.sets.some((s) => !s.done),
      ) ?? session.entries.find((e) => e.sets.some((s) => !s.done)))
    : undefined
  const resting = remaining !== null && session.restSeconds !== null

  return (
    <>
      <div className="screen session-screen">
        <div className="wk-head">
          <div>
            <div className="split">{SPLIT_LABEL[session.split].toUpperCase()}</div>
            <div className="elapsed">
              <Icon name="timer" size={14} strokeWidth={2} />
              {elapsed} · {doneSets}/{totalSets} sets
            </div>
          </div>
          <button className="steel-btn sm" onClick={finish}>
            <Icon name="tick" size={17} />
            Finish
          </button>
        </div>

        {session.entries.length === 0 && (
          <div className="empty">Nothing in this workout yet — add an exercise below.</div>
        )}

        <div className="bands">
        {session.entries.map((entry) => {
          const isOpen = entry.exerciseId === activeId
          const done = entry.sets.filter((s) => s.done)
          const allDone = entry.sets.length > 0 && done.length === entry.sets.length
          const curIndex = entry.sets.findIndex((s) => !s.done)
          const cur = curIndex === -1 ? null : entry.sets[curIndex]!
          const ex = exerciseOf(entry.exerciseId)
          const last = lastPerformance(data.sessions, entry.exerciseId, today)
          const step = toDisplayWeight(ex?.incrementKg ?? 2.5, unit)
          const restSeconds = ex?.restSeconds ?? 60

          return (
            <div
              className={`strap${isOpen ? ' open' : ''}`}
              key={entry.exerciseId}
              ref={isOpen ? openRef : undefined}
            >
              <button
                className="strap-row"
                aria-expanded={isOpen}
                onClick={() => setOpenId(entry.exerciseId)}
              >
                <span className="holes" aria-hidden="true">
                  {entry.sets.map((s, i) => (
                    <span
                      key={i}
                      className={`pin${s.done ? ' filled' : ''}${
                        isOpen && i === curIndex ? ' cur' : ''
                      }${punched === `${entry.exerciseId}:${i}` ? ' punched' : ''}`}
                    />
                  ))}
                </span>
                <span className="nm">{nameOf(entry.exerciseId)}</span>
                {!isOpen && (
                  <span className="sm">{done.length ? formatSetSummary(done, unit) : ''}</span>
                )}
              </button>

              {isOpen && (
                <div className="strap-body">
                  <div className="tooled">
                    {last ? (
                      <>
                        <span>
                          {formatDaysAgo(last.daysAgo)} · {formatSetSummary(last.sets, unit)}
                        </span>
                        {cur &&
                          cur.weightKg > Math.max(...last.sets.map((s) => s.weightKg)) && (
                            <span className="up">
                              <Icon name="up" size={11} strokeWidth={2.8} /> heavier
                            </span>
                          )}
                      </>
                    ) : (
                      <span>no history yet</span>
                    )}
                  </div>

                  {entry.sets.map((s, i) =>
                    s.done ? (
                      <button
                        className="done-set"
                        key={i}
                        onClick={() => undoSet(entry.exerciseId, i)}
                        aria-label={`undo ${nameOf(entry.exerciseId)} set ${i + 1}`}
                      >
                        <span className="tick">
                          <Icon name="tick" size={16} strokeWidth={2.4} />
                        </span>
                        <span className="lbl">Set {i + 1}</span>
                        <span className="val num">
                          {Math.round(toDisplayWeight(s.weightKg, unit) * 100) / 100} {unit} ×{' '}
                          {s.reps}
                        </span>
                      </button>
                    ) : null,
                  )}

                  {cur && (
                    <>
                      <div className="cur-label">
                        <span>Set {curIndex + 1}</span>
                        <button
                          className="rest-chip"
                          aria-label={`rest ${restSeconds} seconds, tap to change`}
                          onClick={() => setPickingRest((v) => !v)}
                        >
                          <Icon name="timer" size={15} strokeWidth={2} />
                          {formatDuration(restSeconds)}
                        </button>
                      </div>

                      {pickingRest && (
                        <div className="rest-pick">
                          {REST_CHOICES.map((sec) => (
                            <button
                              key={sec}
                              aria-pressed={sec === restSeconds}
                              aria-label={`set rest to ${formatDuration(sec)}`}
                              onClick={() => chooseRest(entry.exerciseId, sec)}
                            >
                              {formatDuration(sec)}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="cur-inputs">
                        <Stepper
                          ariaLabel={`${nameOf(entry.exerciseId)} set ${curIndex + 1} weight`}
                          value={Math.round(toDisplayWeight(cur.weightKg, unit) * 100) / 100}
                          step={step}
                          suffix={unit}
                          onChange={(v) =>
                            editSet(entry.exerciseId, curIndex, {
                              weightKg: fromDisplayWeight(v, unit),
                            })
                          }
                        />
                        <Stepper
                          ariaLabel={`${nameOf(entry.exerciseId)} set ${curIndex + 1} reps`}
                          value={cur.reps}
                          step={1}
                          suffix="reps"
                          onChange={(v) =>
                            editSet(entry.exerciseId, curIndex, { reps: Math.round(v) })
                          }
                        />
                      </div>
                    </>
                  )}

                  {!cur && <div className="empty">All {entry.sets.length} sets done</div>}

                  <div className="strap-foot">
                    <button onClick={() => addSet(entry.exerciseId)}>
                      <Icon name="plus" size={16} />
                      Add set
                    </button>
                    {allDone && nextUnfinished && (
                      <button className="next" onClick={() => setOpenId(nextUnfinished.exerciseId)}>
                        Next
                        <Icon name="next" size={16} />
                      </button>
                    )}
                    <button
                      className="drop"
                      onClick={() => dropExercise(entry.exerciseId)}
                      aria-label={`remove ${nameOf(entry.exerciseId)} from this workout`}
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        </div>

        <button className="steel-btn" style={{ marginTop: 'var(--s4)' }} onClick={() => setAdding(true)}>
          <Icon name="plus" size={19} />
          Add exercise
        </button>

        {/* Discard lives down here, a scroll away from Finish. Sitting them side
            by side in the header put "throw the whole workout away" one thumb's
            width from "save it". */}
        <button className="quiet danger" style={{ marginTop: 'var(--s5)' }} onClick={discard}>
          Discard this workout
        </button>
      </div>

      {/* The dock. The commit action lives here, at the thumb, and never leaves —
          rest included. An earlier build replaced the button with the rest timer,
          which made Skip the only route back to the primary action for most of a
          session's wall-clock. Rest is a strip above it, and the dock's height is
          fixed so neither state shifts the other. */}
      {activeEntry && (
        <div className="dock">
          {resting && (
            <>
              <div
                className={`rest${remaining === 0 ? ' over' : ''}`}
                role="timer"
                aria-label="rest remaining"
              >
                <div
                  className="track"
                  style={{
                    transform: `scaleX(${Math.max(
                      0,
                      Math.min(1, remaining / session.restSeconds!),
                    )})`,
                  }}
                />
                <span className="t num">{formatDuration(remaining)}</span>
                <span className="lab">{remaining === 0 ? 'Go' : 'Rest'}</span>
                <div className="rest-actions">
                  <button onClick={() => bumpRest(-30)} aria-label="−30s">
                    −30s
                  </button>
                  <button onClick={skipRest}>Skip</button>
                  <button onClick={() => bumpRest(30)} aria-label="+30s">
                    +30s
                  </button>
                </div>
              </div>
            </>
          )}

          {activeCur ? (
            <>
              <div className="who">
                <span>
                  {nameOf(activeEntry.exerciseId)} · set {activeCurIndex + 1}
                </span>
                <span className="load num">
                  {Math.round(toDisplayWeight(activeCur.weightKg, unit) * 100) / 100} {unit} ×{' '}
                  {activeCur.reps}
                </span>
              </div>
              <button
                className="buckle"
                disabled={activeCur.reps < 1}
                onClick={() => completeSet(activeEntry.exerciseId, activeCurIndex)}
                aria-label={`mark ${nameOf(activeEntry.exerciseId)} set ${
                  activeCurIndex + 1
                } done`}
              >
                <span className="stitch" aria-hidden="true" />
                Log set {activeCurIndex + 1}
              </button>
            </>
          ) : nextUnfinished ? (
            <>
              <div className="who">
                <span>{nameOf(activeEntry.exerciseId)}</span>
                <span className="load">all sets done</span>
              </div>
              <button className="buckle" onClick={() => setOpenId(nextUnfinished.exerciseId)}>
                <span className="stitch" aria-hidden="true" />
                {nameOf(nextUnfinished.exerciseId)}
                <Icon name="next" size={20} strokeWidth={2.4} />
              </button>
            </>
          ) : (
            <>
              <div className="who">
                <span>Every set logged</span>
                <span className="load num">
                  {doneSets}/{totalSets}
                </span>
              </div>
              <button className="buckle" onClick={finish}>
                <span className="stitch" aria-hidden="true" />
                <Icon name="tick" size={20} strokeWidth={2.4} />
                Finish workout
              </button>
            </>
          )}
        </div>
      )}

      {adding && (
        <Sheet title="Add exercise" onClose={() => setAdding(false)}>
          {addable.length === 0 ? (
            <div className="empty">Every exercise is already in this workout.</div>
          ) : (
            addable.map((e) => (
              <button
                key={e.id}
                className="steel-btn"
                style={{ marginBottom: 8, justifyContent: 'flex-start' }}
                onClick={() => addExercise(e.id)}
              >
                {e.name}
              </button>
            ))
          )}
        </Sheet>
      )}
    </>
  )
}
