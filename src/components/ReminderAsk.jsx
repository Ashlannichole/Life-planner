import { useEffect, useState } from 'react'
import { deviceSettings, hasNativeFeature, setDeviceSettings } from '../lib/native.js'
import { turnOnReminders } from './PhoneSettings.jsx'
import { useToast } from './ui.jsx'

/**
 * In the iPhone app, once: offer gentle reminders right on Today instead of hiding them
 * in Settings. Out of sight is out of mind; a morning check-in fixes that.
 */
export default function ReminderAsk() {
  const toast = useToast()
  const [device, setDevice] = useState(deviceSettings)
  useEffect(() => {
    const onChange = (e) => setDevice(e.detail)
    window.addEventListener('sprout-device-change', onChange)
    return () => window.removeEventListener('sprout-device-change', onChange)
  }, [])
  if (!hasNativeFeature('notifications') || device.reminders || device.remindersAsked) return null

  return (
    <div className="card holiday-card stack" style={{ gap: 10 }}>
      <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
        <span className="holiday-emoji" aria-hidden="true">
          🔔
        </span>
        <div>
          <b>Want a gentle nudge?</b>
          <p className="small muted" style={{ margin: '2px 0 0' }}>
            A check-in each morning, and one small idea in the afternoon only if nothing’s done yet. Never “overdue”.
          </p>
        </div>
      </div>
      <div className="chips">
        <button className="chip on" onClick={async () => toast(await turnOnReminders())}>
          Yes, nudge me
        </button>
        <button className="chip" onClick={() => setDeviceSettings({ remindersAsked: true })}>
          Not now
        </button>
      </div>
    </div>
  )
}
