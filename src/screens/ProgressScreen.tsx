import { useState } from 'react'
import Segmented from '../components/Segmented'
import RecapCard from '../components/RecapCard'
import ExerciseProgress from '../components/ExerciseProgress'
import PrList from '../components/PrList'
import MonthCalendar from '../components/MonthCalendar'
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

  return (
    <div className="screen">
      <h1>Progress</h1>
      <Segmented options={VIEWS} value={view} onChange={setView} />

      {view === 'recap' && SPLITS.map((s) => <RecapCard key={s} split={s} />)}
      {view === 'exercise' && <ExerciseProgress />}
      {view === 'prs' && <PrList />}
      {view === 'calendar' && <MonthCalendar />}
    </div>
  )
}
