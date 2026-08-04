import { useState } from 'react'
import Segmented from '../components/Segmented'
import RecapCard from '../components/RecapCard'
import ExerciseProgress from '../components/ExerciseProgress'
import PrList from '../components/PrList'
import MonthCalendar from '../components/MonthCalendar'
import { useStore } from '../store/StoreContext'
import { finishedSessions } from '../logic/history'
import { sessionVolume } from '../logic/sets'
import { toDisplayWeight } from '../logic/units'
import { SPLITS } from '../types'

type View = 'recap' | 'exercise' | 'prs' | 'calendar'

const VIEWS: { id: View; label: string }[] = [
  { id: 'recap', label: 'Recap' },
  { id: 'exercise', label: 'Exercise' },
  { id: 'prs', label: 'PRs' },
  { id: 'calendar', label: 'Calendar' },
]

export default function ProgressScreen() {
  const [view, setView] = useState<View>('recap')
  const { data } = useStore()

  const finished = finishedSessions(data.sessions)
  const lifted = finished.reduce((kg, s) => kg + sessionVolume(s), 0)

  return (
    <div className="screen">
      <header className="rail">
        <span className="where">Progress</span>
        <span className="when">
          {Math.round(toDisplayWeight(lifted, data.settings.unit)).toLocaleString()}{' '}
          {data.settings.unit} lifted
        </span>
      </header>

      <Segmented options={VIEWS} value={view} onChange={setView} />

      {view === 'recap' && SPLITS.map((s) => <RecapCard key={s} split={s} />)}
      {view === 'exercise' && <ExerciseProgress />}
      {view === 'prs' && <PrList />}
      {view === 'calendar' && <MonthCalendar />}
    </div>
  )
}
