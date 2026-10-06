import { hasPlus } from '../lib/plus.js'
import { useStore } from '../store.jsx'
import { HealthSummary } from './PhoneSettings.jsx'

const SHORT_SLEEP = 6 * 60

/** Why today might call for less, from Apple Health (Oura, Apple Watch…), or null. */
export function healthNudge(health) {
  if (!health) return null
  if (health.sleepMinutes != null && health.sleepMinutes < SHORT_SLEEP) {
    const h = Math.floor(health.sleepMinutes / 60)
    const m = health.sleepMinutes % 60
    return `You slept ${h}h ${String(m).padStart(2, '0')}m last night.`
  }
  if (health.hrv != null && health.hrvBaseline && health.hrv < health.hrvBaseline * 0.8) {
    return 'Your body looks a bit run down today (heart rate variability is lower than usual).'
  }
  return null
}

/**
 * Plus: today's numbers from Apple Health, and after a rough night a gentle offer to
 * lighten the day. The person decides; nothing changes on its own.
 */
export default function HealthCard({ day }) {
  const { state, today, actions } = useStore()
  if (!hasPlus(state)) return null
  const health = state.health?.[today]
  if (!health) return null
  const nudge = !day.lowEnergy && !day.bedDay && state.settings.healthNudgeSeen !== today ? healthNudge(health) : null

  // The day's numbers live under the greeting (TodayHealthLine); this card is only the offer.
  if (!nudge) return null
  return (
    <div className="card bed-card stack" style={{ gap: 8 }}>
      <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
        <span className="holiday-emoji" aria-hidden="true">
          😴
        </span>
        <div>
          <b>{nudge}</b>
          <p className="small muted" style={{ margin: '2px 0 0' }}>
            Want me to make today lighter?
          </p>
        </div>
      </div>
      <div className="chips">
        <button className="chip on" onClick={() => actions.setEnergy(today, 'low')}>
          🌙 Lighter day
        </button>
        <button className="chip on" onClick={() => actions.setEnergy(today, 'bed')}>
          🛏️ Bed day
        </button>
        <button className="chip" onClick={() => actions.updateSettings({ healthNudgeSeen: today })}>
          I feel fine
        </button>
      </div>
    </div>
  )
}

/** Plus: today's Apple Health numbers, one quiet line under the greeting. */
export function TodayHealthLine() {
  const { state, today } = useStore()
  const health = state.health?.[today]
  if (!hasPlus(state) || !health) return null
  return <HealthSummary health={health} />
}
