import { useEffect, useState } from 'react'
import { askNative, deviceSettings, hasNativeFeature, sendNative, setDeviceSettings } from '../lib/native.js'
import { hasPlus, PLUS_LABEL } from '../lib/plus.js'
import { REMINDER_DEFAULTS } from '../lib/reminders.js'
import { useStore } from '../store.jsx'
import { Toggle, useToast } from './ui.jsx'

/** Settings that only exist in the iPhone app: reminders (free) and Apple Health (Plus). */
export default function PhoneSettings() {
  const { state, today, actions } = useStore()
  const toast = useToast()
  const [device, setDevice] = useState(deviceSettings)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const onChange = (e) => setDevice(e.detail)
    window.addEventListener('sprout-device-change', onChange)
    return () => window.removeEventListener('sprout-device-change', onChange)
  }, [])

  if (!hasNativeFeature('notifications')) return null
  const prefs = { ...REMINDER_DEFAULTS, ...state.settings.reminders }
  const setPrefs = (fields) => actions.updateSettings({ reminders: { ...prefs, ...fields } })
  const health = state.health?.[today]

  const toggleReminders = async (on) => {
    if (!on) {
      setDeviceSettings({ reminders: false })
      sendNative({ type: 'notifications:schedule', items: [] })
      return
    }
    toast(await turnOnReminders())
  }

  const connectHealth = async () => {
    setBusy(true)
    const answer = await askNative({ type: 'health:connect' }, 'health:data', 60000)
    setBusy(false)
    if (answer?.data) {
      setDeviceSettings({ health: true })
      actions.setHealth(answer.data)
      toast('❤️ Connected to Apple Health')
    } else {
      toast('Couldn’t read Apple Health just now')
    }
  }

  return (
    <>
      <div className="section">
        <p className="section-title">Reminders</p>
        <div className="card stack">
          <div className="row spread">
            <span>
              <b>Gentle reminders</b>
              <br />
              <span className="small muted">A morning check-in, an afternoon nudge if nothing’s done yet, and a heads-up before events. Never “overdue”.</span>
            </span>
            <Toggle on={!!device.reminders} onChange={toggleReminders} label="Reminders" />
          </div>
          {device.reminders && (
            <>
              <div className="row spread">
                <label htmlFor="rem-morning">🌱 Morning check-in</label>
                <input id="rem-morning" className="input" type="time" style={{ maxWidth: 130 }} value={prefs.morning} onChange={(e) => setPrefs({ morning: e.target.value || '08:30' })} />
              </div>
              <div className="row spread">
                <span>✨ Afternoon nudge, only if nothing’s done yet</span>
                <Toggle on={prefs.afternoon} onChange={(afternoon) => setPrefs({ afternoon })} label="Afternoon nudge" />
              </div>
              {prefs.afternoon && (
                <div className="row spread">
                  <label htmlFor="rem-afternoon" className="small muted">
                    Afternoon time
                  </label>
                  <input
                    id="rem-afternoon"
                    className="input"
                    type="time"
                    style={{ maxWidth: 130 }}
                    value={prefs.afternoonTime}
                    onChange={(e) => setPrefs({ afternoonTime: e.target.value || '14:30' })}
                  />
                </div>
              )}
              <div className="row spread">
                <span>🌙 Evening nudge (night routines)</span>
                <Toggle on={prefs.evening} onChange={(evening) => setPrefs({ evening })} label="Evening nudge" />
              </div>
              {prefs.evening && (
                <div className="row spread">
                  <label htmlFor="rem-evening" className="small muted">
                    Evening time
                  </label>
                  <input id="rem-evening" className="input" type="time" style={{ maxWidth: 130 }} value={prefs.eveningTime} onChange={(e) => setPrefs({ eveningTime: e.target.value || '19:30' })} />
                </div>
              )}
              <div className="row spread">
                <span>📅 {prefs.eventLead} min before events</span>
                <Toggle on={prefs.events} onChange={(events) => setPrefs({ events })} label="Event reminders" />
              </div>
            </>
          )}
        </div>
      </div>

      {hasNativeFeature('health') && (
        <div className="section">
          <p className="section-title">
            Apple Health <span className="plus-badge">{PLUS_LABEL}</span>
          </p>
          <div className="card stack">
            <p className="small muted" style={{ margin: 0 }}>
              Sleep, heart rate variability, steps and calories from Apple Health, so Sprout can suggest a lighter day after a rough night.
              Using an Oura ring? Turn on Apple Health sharing in the Oura app.
            </p>
            {hasPlus(state) ? (
              <>
                {health && <HealthSummary health={health} />}
                <button className="btn" onClick={connectHealth} disabled={busy}>
                  {busy ? 'Reading Apple Health…' : device.health ? '↻ Refresh from Apple Health' : '❤️ Connect Apple Health'}
                </button>
              </>
            ) : (
              <p className="small" style={{ margin: 0 }}>
                Part of Sprout Plus.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const hm = (min) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`

/** One short line of today's numbers: 💤 7h 40m · 💓 HRV 52 · 🔥 310 cal · 🍽 1,420 eaten · 👟 6,230 */
export function HealthSummary({ health }) {
  const bits = []
  if (health.sleepMinutes != null) bits.push(`💤 ${hm(health.sleepMinutes)}`)
  if (health.hrv != null) bits.push(`💓 HRV ${Math.round(health.hrv)}`)
  if (health.activeKcal != null) bits.push(`🔥 ${Math.round(health.activeKcal).toLocaleString()} cal`)
  if (health.eatenKcal != null) bits.push(`🍽 ${Math.round(health.eatenKcal).toLocaleString()} eaten`)
  if (health.steps != null) bits.push(`👟 ${Math.round(health.steps).toLocaleString()}`)
  if (!bits.length) return null
  return <p className="small health-line">{bits.join(' · ')}</p>
}

/** Ask the phone for permission and switch reminders on. Returns a message to show. */
export async function turnOnReminders() {
  const answer = await askNative({ type: 'notifications:enable' }, 'notifications:status')
  setDeviceSettings({ remindersAsked: true })
  if (!answer?.granted) return 'Notifications are off for Sprout. Turn them on in the iPhone Settings app.'
  setDeviceSettings({ reminders: true })
  return '🔔 Reminders on. Gentle ones, promise.'
}
