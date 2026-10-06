import { useEffect, useState } from 'react'
import Celebration from './components/Celebration.jsx'
import Focus from './components/Focus.jsx'
import Recap from './components/Recap.jsx'
import { NewPasswordSheet } from './components/AccountSheet.jsx'
import { Icon, ToastProvider } from './components/ui.jsx'
import { THEMES } from './lib/milestones.js'
import { hasPlus } from './lib/plus.js'
import { SEASONAL_THEMES, seasonFor } from './lib/seasons.js'
import { useStore } from './store.jsx'
import Events from './views/Events.jsx'
import Garden from './views/Garden.jsx'
import Meals from './views/Meals.jsx'
import Onboarding from './views/Onboarding.jsx'
import Settings from './views/Settings.jsx'
import Tasks from './views/Tasks.jsx'
import Today from './views/Today.jsx'
import Week from './views/Week.jsx'
import Welcome from './views/Welcome.jsx'

const TABS = [
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'week', label: 'Week', icon: 'week' },
  { id: 'tasks', label: 'Tasks', icon: 'list' },
  { id: 'meals', label: 'Meals', icon: 'meals' },
  { id: 'events', label: 'Events', icon: 'event' },
  { id: 'garden', label: 'Garden', icon: 'plant' },
]

// Accent colors for each theme, in light and dark mode.
const THEME_CSS = [...THEMES, ...SEASONAL_THEMES].map(
  (t) => `
[data-theme='${t.id}'] { --accent: ${t.light}; --need: ${t.light}; --accent-soft: ${t.softLight}; --need-soft: ${t.softLight}; }
@media (prefers-color-scheme: dark) {
  [data-theme='${t.id}'] { --accent: ${t.dark}; --need: ${t.dark}; --accent-soft: ${t.softDark}; --need-soft: ${t.softDark}; }
}`,
).join('\n')

// Remembers "Use without an account" on this device so the welcome screen doesn't ask again.
const LOCAL_ONLY_KEY = 'sprout.localOnly'
const readLocalOnly = () => {
  try {
    return localStorage.getItem(LOCAL_ONLY_KEY) === '1'
  } catch {
    return false
  }
}

export default function App() {
  const { state, cloud, today } = useStore()
  const [localOnly, setLocalOnly] = useState(readLocalOnly)
  // Plus: seasonal themes follow the month; otherwise the theme the person picked.
  const theme = state.settings.seasonalTheme && hasPlus(state) ? seasonFor(today).id : state.settings.theme || 'sage'
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  const [tab, setTab] = useState('today')
  const [focus, setFocus] = useState(null) // { key } when open
  const [recapOpen, setRecapOpen] = useState(false)

  // Arrived from a "reset your password" email: ask for the new password right away.
  const recovery = cloud.recovering && <NewPasswordSheet onClose={cloud.cancelRecovery} />

  if (!state.onboarded) {
    // Accounts on and nobody signed in: sign in / sign up first (or choose to stay on this device).
    // Signed in: wait for the first sync, so a returning account skips setup and lands on its own plan.
    const firstSyncDone = cloud.lastSynced != null || cloud.status === 'error' || cloud.status === 'offline'
    let screen = <Onboarding />
    if (cloud.available && !cloud.user && !localOnly) {
      screen = (
        <Welcome
          onSkip={() => {
            try {
              localStorage.setItem(LOCAL_ONLY_KEY, '1')
            } catch {
              // Private browsing: it just asks again next time.
            }
            setLocalOnly(true)
          }}
        />
      )
    } else if (cloud.user && !firstSyncDone) {
      screen = (
        <div className="onboarding" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <p className="muted">Getting your plan…</p>
        </div>
      )
    }
    return (
      <ToastProvider>
        <style>{THEME_CSS}</style>
        {screen}
        {recovery}
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
      <style>{THEME_CSS}</style>
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
      {recovery}
    </ToastProvider>
  )
}
