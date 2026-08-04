import { useState } from 'react'
import Sheet from './Sheet'
import { useStore } from '../store/StoreContext'
import { newId } from '../logic/id'
import { todayISO } from '../logic/dates'
import { formatPace, paceSecPerKm } from '../logic/units'

export default function QuickAddRun({ onClose }: { onClose: () => void }) {
  const { saveRun } = useStore()
  const [km, setKm] = useState('')
  const [min, setMin] = useState('')
  const [sec, setSec] = useState('')

  const distanceKm = Number(km.replace(',', '.'))
  const durationSec = (Number(min) || 0) * 60 + (Number(sec) || 0)
  const valid = Number.isFinite(distanceKm) && distanceKm > 0 && durationSec > 0

  const pace = valid ? paceSecPerKm({ id: '', date: '', distanceKm, durationSec }) : null

  function save() {
    void saveRun({ id: newId(), date: todayISO(new Date()), distanceKm, durationSec })
    onClose()
  }

  return (
    <Sheet
      title="Log run"
      onClose={onClose}
      primary={{ label: 'Save', onClick: save, disabled: !valid }}
    >
      <div className="field">
        <label htmlFor="run-km">Distance (km)</label>
        <input
          id="run-km"
          type="text"
          inputMode="decimal"
          autoFocus
          value={km}
          onChange={(e) => setKm(e.target.value)}
        />
      </div>
      <div className="row" style={{ marginBottom: 12 }}>
        <div className="field grow" style={{ margin: 0 }}>
          <label htmlFor="run-min">Minutes</label>
          <input
            id="run-min"
            type="text"
            inputMode="numeric"
            value={min}
            onChange={(e) => setMin(e.target.value)}
          />
        </div>
        <div className="field grow" style={{ margin: 0 }}>
          <label htmlFor="run-sec">Seconds</label>
          <input
            id="run-sec"
            type="text"
            inputMode="numeric"
            value={sec}
            onChange={(e) => setSec(e.target.value)}
          />
        </div>
      </div>
      <div className="sub num">
        {pace === null
          ? 'Pace appears once distance and time are set'
          : `pace ${formatPace(pace)} /km`}
      </div>
    </Sheet>
  )
}
