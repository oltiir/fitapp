import Icon, { type IconName } from './Icon'

export type Tab = 'today' | 'progress' | 'body' | 'settings'

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Today', icon: 'barbell' },
  { id: 'progress', label: 'Progress', icon: 'chart' },
  { id: 'body', label: 'Body', icon: 'torso' },
  { id: 'settings', label: 'Settings', icon: 'bolt' },
]

export default function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          aria-label={t.label}
          aria-current={active === t.id ? 'page' : undefined}
        >
          <Icon name={t.icon} size={23} />
          {t.label}
        </button>
      ))}
    </nav>
  )
}
