import { useState } from 'react'
import { useStore } from '../store/StoreContext'
import Sheet from './Sheet'
import { SPLIT_LABEL, type Split } from '../types'

export default function TemplateEditor({ split }: { split: Split }) {
  const { data, saveTemplate } = useStore()
  const [picking, setPicking] = useState(false)

  const template = data.templates.find((t) => t.split === split)
  const ids = template?.exerciseIds ?? []
  const nameOf = (id: string) => data.exercises.find((e) => e.id === id)?.name ?? id

  function write(exerciseIds: string[]) {
    void saveTemplate({ split, exerciseIds, updatedAt: new Date().toISOString() })
  }

  // Up/down buttons rather than drag-and-drop: dragging fights the scroll
  // container on touch and is unreliable in a standalone PWA.
  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= ids.length) return
    const next = ids.slice()
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item!)
    write(next)
  }

  const addable = data.exercises
    .filter((e) => !e.archived && !ids.includes(e.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <div className="card">
        {ids.length === 0 ? (
          <div className="empty">No exercises in this template yet.</div>
        ) : (
          ids.map((id, i) => (
            <div key={id} className="list-item">
              <span className="sub mono" style={{ width: 18 }}>
                {i + 1}
              </span>
              <div className="grow">{nameOf(id)}</div>
              <button
                className="icon-btn"
                aria-label={`move ${nameOf(id)} up`}
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                ↑
              </button>
              <button
                className="icon-btn"
                aria-label={`move ${nameOf(id)} down`}
                disabled={i === ids.length - 1}
                onClick={() => move(i, 1)}
              >
                ↓
              </button>
              <button
                className="icon-btn btn-danger"
                aria-label={`remove ${nameOf(id)}`}
                onClick={() => write(ids.filter((x) => x !== id))}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      <button className="btn" onClick={() => setPicking(true)}>
        + Add exercise to {SPLIT_LABEL[split]}
      </button>

      {picking && (
        <Sheet title={`Add to ${SPLIT_LABEL[split]}`} onClose={() => setPicking(false)}>
          {addable.length === 0 ? (
            <div className="empty">Every exercise is already in this template.</div>
          ) : (
            addable.map((e) => (
              <button
                key={e.id}
                className="btn"
                style={{ marginBottom: 8, justifyContent: 'flex-start' }}
                onClick={() => {
                  write([...ids, e.id])
                  setPicking(false)
                }}
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
