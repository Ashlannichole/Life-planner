import { useEffect } from 'react'
import { useStore } from '../store.jsx'

/**
 * Free for everyone: after a few days away, no pile of what was missed. Just a hello and
 * an easy way back in. The plan has already re-planned itself; nothing is overdue.
 */
export default function WelcomeBack({ items, onFocus }) {
  const { state, today, cloud, actions } = useStore()
  // Wait for the first sync when signed in, so time spent on another device counts.
  const ready = !cloud.user || cloud.lastSynced != null || cloud.status === 'offline' || cloud.status === 'error'
  useEffect(() => {
    if (ready) actions.markOpened()
  }, [ready, today, actions])

  const wb = state.settings.welcomeBack
  if (!wb || wb.on !== today) return null
  const smallest = [...items].sort((a, b) => a.minutes - b.minutes)[0]

  return (
    <div className="card bed-card stack" style={{ gap: 10 }}>
      <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
        <span className="holiday-emoji" aria-hidden="true">
          🌱
        </span>
        <div>
          <b>Welcome back!</b>
          <p className="small muted" style={{ margin: '2px 0 0' }}>
            Nothing piled up while you were away. I re-planned everything, so it’s a fresh start. Want an easy one today?
          </p>
        </div>
      </div>
      <div className="chips">
        {smallest && (
          <button
            className="chip on"
            onClick={() => {
              actions.dismissWelcomeBack()
              onFocus(smallest)
            }}
          >
            Just one tiny thing
          </button>
        )}
        <button
          className="chip on"
          onClick={() => {
            actions.setEnergy(today, 'low')
            actions.dismissWelcomeBack()
          }}
        >
          Keep today light
        </button>
        <button className="chip" onClick={() => actions.dismissWelcomeBack()}>
          I’m good 💪
        </button>
      </div>
    </div>
  )
}
