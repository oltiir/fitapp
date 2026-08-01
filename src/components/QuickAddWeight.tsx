import { useState } from 'react'
import Modal from './Modal'
import { useStore } from '../store/StoreContext'
import { newId } from '../logic/id'
import { todayISO } from '../logic/dates'
import { fromDisplayWeight, toDisplayWeight } from '../logic/units'

export default function QuickAddWeight({ onClose }: { onClose: () => void }) {
  const { data, saveBodyWeight } = useStore()
  const unit = data.settings.unit

  // Default to the last reading: a weigh-in is a nudge from the previous number,
  // not a blank field.
  const latest = data.bodyweights
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .pop()
  const [value, setValue] = useState(
    latest ? String(Math.round(toDisplayWeight(latest.kg, unit) * 10) / 10) : '',
  )

  const parsed = Number(value.replace(',', '.'))
  const valid = Number.isFinite(parsed) && parsed > 0

  function save() {
    void saveBodyWeight({
      id: newId(),
      date: todayISO(new Date()),
      kg: fromDisplayWeight(parsed, unit),
    })
    onClose()
  }

  return (
    <Modal title="Log bodyweight" onClose={onClose}>
      <div className="field">
        <label htmlFor="bw-value">Weight ({unit})</label>
        <input
          id="bw-value"
          type="text"
          inputMode="decimal"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <button className="btn btn-primary" disabled={!valid} onClick={save}>
        Save
      </button>
    </Modal>
  )
}
