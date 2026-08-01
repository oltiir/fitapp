import { useEffect, useState } from 'react'
import { useStore } from '../store/StoreContext'
import Stepper from '../components/Stepper'
import RestBar from '../components/RestBar'
import Modal from '../components/Modal'
import { beep } from '../lib/audio'
import { useWakeLock } from '../hooks/useWakeLock'
import { emptySet } from '../logic/sets'
import { lastPerformance } from '../logic/history'
import { todayISO } from '../logic/dates'
import { formatSetSummary, fromDisplayWeight, toDisplayWeight } from '../logic/units'
import { SPLIT_LABEL, type SetEntry, type Session } from '../types'

export default function SessionScreen({
  sessionId,
  onExit,
}: {
  sessionId: string
  onExit: () => void
}) {
  const { data, saveSession, removeSession } = useStore()
  const [adding, setAdding] = useState(false)
  const session = data.sessions.find((s) => s.id === sessionId)

  useWakeLock(session !== undefined)

  // If the session vanished (discarded elsewhere, or a stale id), leave rather than crash.
  useEffect(() => {
    if (!session) onExit()
  }, [session, onExit])

  // Resuming a session left open for hours would otherwise show a "Rest done"
  // bar for a rest that ended long ago. Clear anything stale on open only —
  // clearing continuously would yank the bar away seconds after a real rest.
  const staleRest =
    session?.restStartedAt != null &&
    session.restSeconds != null &&
    (Date.now() - new Date(session.restStartedAt).getTime()) / 1000 > session.restSeconds + 300
  useEffect(() => {
    if (session && staleRest) {
      void saveSession({ ...session, restStartedAt: null, restSeconds: null })
    }
    // Deliberately keyed on the session id alone: this is an on-open cleanup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  if (!session) return null

  // Arrow consts rather than function declarations: declarations hoist above the
  // guard above, which costs the non-undefined narrowing of `session`.
  const unit = data.settings.unit
  const today = todayISO(new Date())
  const nameOf = (id: string) => data.exercises.find((e) => e.id === id)?.name ?? id
  const stepFor = (exerciseId: string) =>
    toDisplayWeight(data.exercises.find((e) => e.id === exerciseId)?.incrementKg ?? 2.5, unit)

  const patch = (next: Session) => void saveSession(next)

  const replaceSets = (entryIndex: number, sets: SetEntry[]) =>
    patch({
      ...session,
      entries: session.entries.map((e, i) => (i === entryIndex ? { ...e, sets } : e)),
    })

  const editSet = (entryIndex: number, setIndex: number, changes: Partial<SetEntry>) =>
    replaceSets(
      entryIndex,
      session.entries[entryIndex]!.sets.map((s, j) => (j === setIndex ? { ...s, ...changes } : s)),
    )

  const toggleSet = (entryIndex: number, setIndex: number) => {
    const entry = session.entries[entryIndex]!
    const nowDone = !entry.sets[setIndex]!.done
    const exercise = data.exercises.find((x) => x.id === entry.exerciseId)
    patch({
      ...session,
      entries: session.entries.map((e, i) =>
        i !== entryIndex
          ? e
          : { ...e, sets: e.sets.map((s, j) => (j === setIndex ? { ...s, done: nowDone } : s)) },
      ),
      // Completing a set starts the rest timer; un-checking deliberately leaves it alone.
      restStartedAt: nowDone ? new Date().toISOString() : session.restStartedAt,
      restSeconds: nowDone ? (exercise?.restSeconds ?? 120) : session.restSeconds,
    })
  }

  const addSet = (entryIndex: number) => {
    const sets = session.entries[entryIndex]!.sets
    const last = sets[sets.length - 1]
    const next: SetEntry = last
      ? { weightKg: last.weightKg, reps: last.reps, done: false }
      : emptySet()
    replaceSets(entryIndex, [...sets, next])
  }

  const removeLastSet = (entryIndex: number) =>
    replaceSets(entryIndex, session.entries[entryIndex]!.sets.slice(0, -1))

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
    setAdding(false)
  }

  const dropExercise = (entryIndex: number) => {
    // Removing an exercise that has completed sets throws away logged work.
    const logged = session.entries[entryIndex]!.sets.filter((s) => s.done).length
    if (logged > 0 && !confirm(`Remove this exercise? ${logged} logged set(s) will be lost.`)) return
    patch({ ...session, entries: session.entries.filter((_, i) => i !== entryIndex) })
  }

  const finish = () => {
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

  const started = new Date(session.startedAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  const addable = data.exercises
    .filter((e) => !e.archived && !session.entries.some((x) => x.exerciseId === e.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="screen session-screen">
      <div className="sticky-head spread">
        <div>
          <strong>{SPLIT_LABEL[session.split].toUpperCase()}</strong>
          <span className="sub"> · started {started}</span>
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
        <div className="empty">
          No exercises in this session. Add one below, or edit the template in Settings.
        </div>
      )}

      {session.entries.map((entry, entryIndex) => {
        const last = lastPerformance(data.sessions, entry.exerciseId, today)
        return (
          <div className="card" key={`${entry.exerciseId}-${entryIndex}`}>
            <div className="exercise-head spread">
              <div>
                <div className="name">{nameOf(entry.exerciseId)}</div>
                <div className="last">
                  {last
                    ? `last time · ${last.daysAgo}d ago · ${formatSetSummary(last.sets, unit)}`
                    : 'no history yet'}
                </div>
              </div>
              <button
                className="icon-btn"
                aria-label={`remove ${nameOf(entry.exerciseId)} from this workout`}
                onClick={() => dropExercise(entryIndex)}
              >
                ✕
              </button>
            </div>

            {entry.sets.map((s, setIndex) => (
              <div className="set-row" key={setIndex}>
                <div className="set-head">
                  <span className="set-num">Set {setIndex + 1}</span>
                </div>
                <button
                  className="check-btn"
                  data-done={s.done}
                  aria-label={`mark ${nameOf(entry.exerciseId)} set ${setIndex + 1} ${
                    s.done ? 'not done' : 'done'
                  }`}
                  onClick={() => toggleSet(entryIndex, setIndex)}
                >
                  {s.done ? '✓' : '○'}
                </button>
                <div className="set-inputs">
                  <Stepper
                    ariaLabel={`${nameOf(entry.exerciseId)} set ${setIndex + 1} weight`}
                    value={Math.round(toDisplayWeight(s.weightKg, unit) * 100) / 100}
                    step={stepFor(entry.exerciseId)}
                    suffix={unit}
                    onChange={(v) =>
                      editSet(entryIndex, setIndex, { weightKg: fromDisplayWeight(v, unit) })
                    }
                  />
                  <Stepper
                    ariaLabel={`${nameOf(entry.exerciseId)} set ${setIndex + 1} reps`}
                    value={s.reps}
                    step={1}
                    suffix="reps"
                    onChange={(v) => editSet(entryIndex, setIndex, { reps: Math.round(v) })}
                  />
                </div>
              </div>
            ))}

            <div className="row">
              <button className="btn btn-sm btn-ghost" onClick={() => addSet(entryIndex)}>
                + set
              </button>
              {entry.sets.length > 1 && (
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => removeLastSet(entryIndex)}
                >
                  − set
                </button>
              )}
            </div>
          </div>
        )
      })}

      <button className="btn" onClick={() => setAdding(true)}>
        + Add exercise
      </button>

      {adding && (
        <Modal title="Add exercise" onClose={() => setAdding(false)}>
          {addable.length === 0 ? (
            <div className="empty">Every exercise is already in this workout.</div>
          ) : (
            addable.map((e) => (
              <button
                key={e.id}
                className="btn btn-ghost"
                style={{ marginBottom: 8, justifyContent: 'flex-start' }}
                onClick={() => addExercise(e.id)}
              >
                {e.name}
              </button>
            ))
          )}
        </Modal>
      )}

      <RestBar
        session={session}
        beepEnabled={data.settings.restBeepEnabled}
        onBeep={beep}
        withTabs={false}
        onExtend={(seconds) =>
          patch({ ...session, restSeconds: (session.restSeconds ?? 0) + seconds })
        }
        onSkip={() => patch({ ...session, restStartedAt: null, restSeconds: null })}
      />
    </div>
  )
}
