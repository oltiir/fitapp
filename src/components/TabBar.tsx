export type Tab = 'today' | 'progress' | 'body' | 'settings'

const TABS: { id: Tab; label: string; glyph: string }[] = [
  { id: 'today', label: 'Today', glyph: '🏋' },
  { id: 'progress', label: 'Progress', glyph: '📈' },
  { id: 'body', label: 'Body', glyph: '⚖' },
  { id: 'settings', label: 'Settings', glyph: '⚙' },
]

export default function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          aria-current={active === t.id ? 'page' : undefined}
        >
          <span className="glyph">{t.glyph}</span>
          {t.label}
        </button>
      ))}
    </nav>
  )
}
