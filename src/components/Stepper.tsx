import { useState } from 'react'

export default function Stepper({
  value,
  onChange,
  step,
  min = 0,
  suffix,
  ariaLabel,
}: {
  value: number
  onChange: (v: number) => void
  step: number
  min?: number
  suffix?: string
  ariaLabel: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  function commit() {
    const parsed = Number(draft.replace(',', '.'))
    if (Number.isFinite(parsed)) onChange(Math.max(min, parsed))
    setEditing(false)
  }

  // Steps can be fractional (2.5 kg); round to 3dp so repeated additions stay clean.
  const bump = (delta: number) => onChange(Math.max(min, Math.round((value + delta) * 1000) / 1000))

  return (
    <div className="stepper" role="group" aria-label={ariaLabel}>
      <button
        className="stepper-btn"
        onClick={() => bump(-step)}
        aria-label={`decrease ${ariaLabel}`}
      >
        −
      </button>
      {editing ? (
        <input
          className="stepper-input"
          type="text"
          inputMode="decimal"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
          }}
        />
      ) : (
        <button
          className="stepper-value mono"
          aria-label={ariaLabel}
          onClick={() => {
            setDraft(String(value))
            setEditing(true)
          }}
        >
          {value}
          {suffix ? <span className="stepper-suffix">{suffix}</span> : null}
        </button>
      )}
      <button className="stepper-btn" onClick={() => bump(step)} aria-label={`increase ${ariaLabel}`}>
        +
      </button>
    </div>
  )
}
