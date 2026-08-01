import { useEffect, useState } from 'react'
import { useStore } from '../store/StoreContext'
import Stepper from '../components/Stepper'
import Sheet from '../components/Sheet'
import { beep } from '../lib/audio'
import { useWakeLock } from '../hooks/useWakeLock'
import { useTicker } from '../hooks/useTicker'
import { emptySet } from '../logic/sets'
import { lastPerformance } from '../logic/history'
import { restJustFinished, restRemaining } from '../logic/rest'
import { todayISO } from '../logic/dates'
import {
  formatDuration,
  formatSetSummary,
  fromDisplayWeight,
  toDisplayWeight,
} from '../logic/units'
import { SPLIT_LABEL, type SetEntry, type Session } from '../types'

/** Tapping the rest chip cycles these, and the choice sticks to the exercise. */
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
  const session = data.sessions.find((s) => s.id === sessionId)

  useWakeLock(session !== undefined)
  useTicker(1000, session !== undefined) // elapsed clock + rest countdown

  useEffect(() => {
    if (!session) onExit()
  }, [session, onExit])

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
  }

  const undoSet = (exerciseId: string, i: number) =>
    editSet(exerciseId, i, { done: false })

  const addSet = (exerciseId: string) => {
    const entry = session.entries.find((e) => e.exerciseId === exerciseId)
    if (!entry) return
    const last = entry.sets[entry.sets.length - 1]
    setSets(exerciseId, [
      ...entry.sets,
      last ? { weightKg: last.weightKg, reps: last.reps, done: false } : emptySet(),
    ])
  }

  const cycleRest = (exerciseId: string) => {
    const ex = exerciseOf(exerciseId)
    if (!ex) return
    const i = REST_CHOICES.indexOf(ex.restSeconds)
    const next = REST_CHOICES[(i + 1) % REST_CHOICES.length]!
    void saveExercise({ ...ex, restSeconds: next })
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
    if (logged > 0 && !confirm(`Remove ${nameOf(exerciseId)}? ${logged} logged set(s) will be lost.`))
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

  // --- rest timer, rendered inline inside whichever exercise is open ---
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

  return (
    <div className="screen">
      <div className="wk-head">
        <div>
          <strong>{SPLIT_LABEL[session.split].toUpperCase()}</strong>
          <div className="elapsed">
            {elapsed} · {doneSets}/{totalSets} sets
          </div>
        </div>
        <div className="row">
          <button className="btn btn-sm btn-ghost btn-danger" onClick={discard}>
            Discard
          </button>
          <button className="btn btn-sm btn-primary" onClick={finish}>
            ✓ Finish
          </button>
        </div>
      </div>

      {session.entries.length === 0 && (
        <div className="empty">Nothing in this workout yet — add an exercise below.</div>
      )}

      {session.entries.map((entry) => {
        const isOpen = entry.exerciseId === activeId
        const done = entry.sets.filter((s) => s.done)
        const allDone = entry.sets.length > 0 && done.length === entry.sets.length
        const curIndex = entry.sets.findIndex((s) => !s.done)
        const cur = curIndex === -1 ? null : entry.sets[curIndex]!
        const ex = exerciseOf(entry.exerciseId)
        const last = lastPerformance(data.sessions, entry.exerciseId, today)
        const step = toDisplayWeight(ex?.incrementKg ?? 2.5, unit)

        return (
          <div className={`ex${isOpen ? ' open' : ''}`} key={entry.exerciseId}>
            <button
              className="ex-row"
              aria-expanded={isOpen}
              onClick={() => setOpenId(entry.exerciseId)}
            >
              <span className={`mark${allDone ? ' done' : done.length ? ' part' : ''}`}>
                {allDone ? '✓' : done.length ? '◐' : '○'}
              </span>
              <span className="nm">{nameOf(entry.exerciseId)}</span>
              {!isOpen && <span className="sm">{done.length ? formatSetSummary(done, unit) : ''}</span>}
            </button>

            {isOpen && (
              <div className="ex-body">
                <div className="ex-last">
                  {last
                    ? `last ${last.daysAgo}d ago · ${formatSetSummary(last.sets, unit)}`
                    : 'no history yet'}
                </div>

                {entry.sets.map((s, i) =>
                  s.done ? (
                    <button
                      className="done-set"
                      key={i}
                      onClick={() => undoSet(entry.exerciseId, i)}
                      aria-label={`undo ${nameOf(entry.exerciseId)} set ${i + 1}`}
                    >
                      <span className="tick">✓</span>
                      <span className="lbl">Set {i + 1}</span>
                      <span className="val">
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
                        onClick={() => cycleRest(entry.exerciseId)}
                        aria-label={`rest ${ex?.restSeconds ?? 60} seconds, tap to change`}
                      >
                        rest {formatDuration(ex?.restSeconds ?? 60)} ▾
                      </button>
                    </div>

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

                {remaining !== null && session.restSeconds !== null && (
                  <div className={`rest-inline${remaining === 0 ? ' over' : ''}`}>
                    <div className="t">
                      {remaining === 0 ? 'Rest done — go' : `⏱ ${formatDuration(remaining)}`}
                    </div>
                    <div className="rest-track">
                      <div
                        className="rest-fill"
                        style={{
                          width: `${Math.max(0, Math.min(100, (remaining / session.restSeconds) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="rest-actions">
                      <button onClick={() => bumpRest(-30)}>−30s</button>
                      <button onClick={skipRest}>Skip</button>
                      <button onClick={() => bumpRest(30)}>+30s</button>
                    </div>
                  </div>
                )}

                {cur ? (
                  <button
                    className="do-set"
                    disabled={cur.reps < 1}
                    onClick={() => completeSet(entry.exerciseId, curIndex)}
                    aria-label={`mark ${nameOf(entry.exerciseId)} set ${curIndex + 1} done`}
                  >
                    ✓ Done set {curIndex + 1}
                  </button>
                ) : (
                  <div className="empty" style={{ padding: '10px 0' }}>
                    All {entry.sets.length} sets done
                  </div>
                )}

                <div className="ex-foot">
                  <button onClick={() => addSet(entry.exerciseId)}>+ set</button>
                  {allDone && (
                    <NextButton
                      entries={session.entries}
                      current={entry.exerciseId}
                      onGo={setOpenId}
                    />
                  )}
                  <button
                    className="drop"
                    onClick={() => dropExercise(entry.exerciseId)}
                    aria-label={`remove ${nameOf(entry.exerciseId)} from this workout`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <button className="btn" style={{ marginTop: 6 }} onClick={() => setAdding(true)}>
        + Add exercise
      </button>

      {adding && (
        <Sheet title="Add exercise" onClose={() => setAdding(false)}>
          {addable.length === 0 ? (
            <div className="empty">Every exercise is already in this workout.</div>
          ) : (
            addable.map((e) => (
              <button
                key={e.id}
                className="btn"
                style={{ marginBottom: 8, justifyContent: 'flex-start' }}
                onClick={() => addExercise(e.id)}
              >
                {e.name}
              </button>
            ))
          )}
        </Sheet>
      )}
    </div>
  )
}

function NextButton({
  entries,
  current,
  onGo,
}: {
  entries: Session['entries']
  current: string
  onGo: (id: string) => void
}) {
  const i = entries.findIndex((e) => e.exerciseId === current)
  const next =
    entries.slice(i + 1).find((e) => e.sets.some((s) => !s.done)) ??
    entries.find((e) => e.sets.some((s) => !s.done))
  if (!next) return null
  return (
    <button className="next" onClick={() => onGo(next.exerciseId)}>
      Next ›
    </button>
  )
}
