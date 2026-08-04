import { useState } from 'react'
import { useStore } from '../store/StoreContext'
import Sheet from './Sheet'
import Icon from './Icon'
import { newId } from '../logic/id'
import { formatDuration, fromDisplayWeight, toDisplayWeight } from '../logic/units'
import type { Exercise, Settings } from '../types'

function ExerciseSheet({
  exercise,
  unit,
  onSave,
  onClose,
}: {
  exercise: Exercise
  unit: Settings['unit']
  onSave: (e: Exercise) => void
  onClose: () => void
}) {
  const [name, setName] = useState(exercise.name)
  const [rest, setRest] = useState(String(exercise.restSeconds))
  const [increment, setIncrement] = useState(
    String(Math.round(toDisplayWeight(exercise.incrementKg, unit) * 100) / 100),
  )

  const restSeconds = Math.max(0, Math.round(Number(rest) || 0))
  const incrementValue = Number(increment.replace(',', '.'))
  const valid = name.trim().length > 0 && Number.isFinite(incrementValue) && incrementValue > 0

  function save() {
    onSave({
      ...exercise,
      name: name.trim(),
      restSeconds,
      incrementKg: fromDisplayWeight(incrementValue, unit),
    })
    onClose()
  }

  return (
    <Sheet
      title={exercise.name ? 'Edit exercise' : 'New exercise'}
      onClose={onClose}
      primary={{ label: 'Save', onClick: save, disabled: !valid }}
    >
      <div className="field">
        <label htmlFor="ex-name">Name</label>
        <input id="ex-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="field">
        <label htmlFor="ex-rest">Rest (seconds) — {formatDuration(restSeconds)}</label>
        <input
          id="ex-rest"
          type="text"
          inputMode="numeric"
          value={rest}
          onChange={(e) => setRest(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="ex-inc">Weight step ({unit})</label>
        <input
          id="ex-inc"
          type="text"
          inputMode="decimal"
          value={increment}
          onChange={(e) => setIncrement(e.target.value)}
        />
      </div>
    </Sheet>
  )
}

export default function ExerciseEditor() {
  const { data, saveExercise, removeExercise } = useStore()
  const [editing, setEditing] = useState<Exercise | null>(null)
  const unit = data.settings.unit

  const byName = (a: Exercise, b: Exercise) => a.name.localeCompare(b.name)
  const active = data.exercises.filter((e) => !e.archived).sort(byName)
  const archived = data.exercises.filter((e) => e.archived).sort(byName)

  /** Referenced exercises can only be archived — deleting them would orphan history. */
  const isReferenced = (id: string) =>
    data.sessions.some((s) => s.entries.some((e) => e.exerciseId === id)) ||
    data.templates.some((t) => t.exerciseIds.includes(id))

  function addExercise() {
    setEditing({
      id: newId(),
      name: '',
      restSeconds: 120,
      incrementKg: 2.5,
      archived: false,
      createdAt: new Date().toISOString(),
    })
  }

  function row(e: Exercise) {
    return (
      <div key={e.id} className={`list-item${e.archived ? ' archived' : ''}`}>
        <div className="grow">
          <div className="nm">{e.name}</div>
          <div className="sub num">
            rest {formatDuration(e.restSeconds)} · step{' '}
            {Math.round(toDisplayWeight(e.incrementKg, unit) * 100) / 100} {unit}
            {isReferenced(e.id) ? '' : ' · unused'}
          </div>
        </div>
        <button className="icon-btn" aria-label={`edit ${e.name}`} onClick={() => setEditing(e)}>
          <Icon name="pencil" size={18} />
        </button>
        {e.archived ? (
          <button
            className="icon-btn"
            aria-label={`restore ${e.name}`}
            onClick={() => void saveExercise({ ...e, archived: false })}
          >
            <Icon name="undo" size={18} />
          </button>
        ) : (
          <button
            className="icon-btn"
            aria-label={`archive ${e.name}`}
            onClick={() => void saveExercise({ ...e, archived: true })}
          >
            <Icon name="archive" size={18} />
          </button>
        )}
        {!isReferenced(e.id) && (
          <button
            className="icon-btn danger"
            aria-label={`delete ${e.name}`}
            onClick={() => {
              if (confirm(`Delete ${e.name}? It is not used anywhere.`)) void removeExercise(e.id)
            }}
          >
            <Icon name="close" size={18} />
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {active.length === 0 ? (
        <div className="empty">No exercises.</div>
      ) : (
        <div className="list">{active.map(row)}</div>
      )}

      <button className="steel-btn" onClick={addExercise}>
        <Icon name="plus" size={19} />
        Add exercise
      </button>

      {archived.length > 0 && (
        <>
          <h2 className="rule">Archived</h2>
          <div className="list">{archived.map(row)}</div>
        </>
      )}

      {editing && (
        <ExerciseSheet
          exercise={editing}
          unit={unit}
          onSave={(e) => void saveExercise(e)}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
