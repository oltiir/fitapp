import { useState } from 'react'
import { StoreProvider, useStore } from './store/StoreContext'
import TabBar, { type Tab } from './components/TabBar'
import TodayScreen from './screens/TodayScreen'
import ProgressScreen from './screens/ProgressScreen'
import BodyScreen from './screens/BodyScreen'
import SettingsScreen from './screens/SettingsScreen'

function Shell() {
  const { ready, error } = useStore()
  const [tab, setTab] = useState<Tab>('today')

  if (error) {
    return (
      <div className="screen">
        <h1>Storage error</h1>
        <p className="sub">{error}</p>
      </div>
    )
  }
  if (!ready) return <div className="screen empty">Loading…</div>

  return (
    <div className="app">
      {tab === 'today' && <TodayScreen />}
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
