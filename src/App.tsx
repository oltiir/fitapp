import { useState } from 'react'
import { StoreProvider, useStore } from './store/StoreContext'
import TabBar, { type Tab } from './components/TabBar'
import TodayScreen from './screens/TodayScreen'
import SessionScreen from './screens/SessionScreen'
import ProgressScreen from './screens/ProgressScreen'
import BodyScreen from './screens/BodyScreen'
import SettingsScreen from './screens/SettingsScreen'

function Shell() {
  const { ready, error } = useStore()
  const [tab, setTab] = useState<Tab>('today')
  const [openSessionId, setOpenSessionId] = useState<string | null>(null)

  if (error) {
    return (
      <div className="screen">
        <h1>Storage error</h1>
        <p className="sub">{error}</p>
      </div>
    )
  }
  if (!ready) return <div className="screen empty">Loading…</div>

  // An open session takes over the whole screen, tab bar included, so a workout
  // cannot be navigated away from by a mis-tap. The app still always *opens* on
  // Today: an unfinished session shows as a resume banner rather than auto-opening.
  if (openSessionId !== null) {
    return (
      <div className="app">
        <SessionScreen sessionId={openSessionId} onExit={() => setOpenSessionId(null)} />
      </div>
    )
  }

  return (
    <div className="app">
      {tab === 'today' && (
        <TodayScreen onOpenSession={setOpenSessionId} onGoToSettings={() => setTab('settings')} />
      )}
      {tab === 'progress' && <ProgressScreen />}
      {tab === 'body' && <BodyScreen />}
      {tab === 'settings' && <SettingsScreen />}
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
