import { useState } from 'react'
import Celebration from './components/Celebration.jsx'
import Focus from './components/Focus.jsx'
import Recap from './components/Recap.jsx'
import { Icon, ToastProvider } from './components/ui.jsx'
import { useStore } from './store.jsx'
import Events from './views/Events.jsx'
import Garden from './views/Garden.jsx'
import Meals from './views/Meals.jsx'
import Onboarding from './views/Onboarding.jsx'
import Settings from './views/Settings.jsx'
import Tasks from './views/Tasks.jsx'
import Today from './views/Today.jsx'
import Week from './views/Week.jsx'

const TABS = [
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'week', label: 'Week', icon: 'week' },
  { id: 'tasks', label: 'Tasks', icon: 'list' },
  { id: 'meals', label: 'Meals', icon: 'meals' },
  { id: 'events', label: 'Events', icon: 'event' },
  { id: 'garden', label: 'Garden', icon: 'plant' },
]

export default function App() {
  const { state } = useStore()
  const [tab, setTab] = useState('today')
  const [focus, setFocus] = useState(null) // { key } when open
  const [recapOpen, setRecapOpen] = useState(false)

  if (!state.onboarded) {
    return (
      <ToastProvider>
        <Onboarding />
      </ToastProvider>
    )
  }

  const go = (id) => {
    setTab(id)
    window.scrollTo({ top: 0 })
  }
  const openFocus = (item) => setFocus({ key: item?.key || null })
  const openRecap = () => setRecapOpen(true)

  return (
    <ToastProvider>
      <div className="app">
        {tab !== 'settings' && (
          <div className="topbar" style={{ marginBottom: 4, justifyContent: 'flex-end' }}>
            <button className="icon-btn" onClick={() => go('settings')} aria-label="Settings">
              <Icon name="gear" />
            </button>
          </div>
        )}
        <main>
          {tab === 'today' && <Today onFocus={openFocus} onNavigate={go} onRecap={openRecap} />}
          {tab === 'week' && <Week />}
          {tab === 'tasks' && <Tasks />}
          {tab === 'meals' && <Meals />}
          {tab === 'events' && <Events />}
          {tab === 'garden' && <Garden onRecap={openRecap} />}
          {tab === 'settings' && <Settings onBack={() => go('today')} />}
        </main>
      </div>

      <nav className="tabbar" aria-label="Main">
        <div className="tabbar-inner">
          {TABS.map((t) => (
            <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
              <Icon name={t.icon} />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {focus && <Focus startKey={focus.key} onClose={() => setFocus(null)} />}
      {recapOpen && <Recap onClose={() => setRecapOpen(false)} />}
      <Celebration onGarden={() => go('garden')} />
    </ToastProvider>
  )
}
