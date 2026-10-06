import { useEffect, useMemo, useState } from 'react'
import { deviceSettings, nativeApp, onNative, sendNative } from '../lib/native.js'
import { buildReminders } from '../lib/reminders.js'
import { useStore } from '../store.jsx'

/**
 * Inside the iPhone app: keeps the phone's reminders in step with the plan and brings in
 * Apple Health numbers. Renders nothing; does nothing in a normal browser.
 */
export default function NativeBridge() {
  const { state, schedule, actions } = useStore()
  const [device, setDevice] = useState(deviceSettings)

  useEffect(() => {
    const onChange = (e) => setDevice(e.detail)
    window.addEventListener('sprout-device-change', onChange)
    return () => window.removeEventListener('sprout-device-change', onChange)
  }, [])

  const reminders = useMemo(
    () => (device.reminders ? buildReminders(state, schedule, state.settings.reminders) : []),
    [device.reminders, state, schedule],
  )
  const signature = JSON.stringify(reminders)

  // Replace the phone's reminders a moment after the plan settles (and clear them when off).
  useEffect(() => {
    if (!nativeApp()) return
    const t = setTimeout(() => sendNative({ type: 'notifications:schedule', items: JSON.parse(signature) }), 1500)
    return () => clearTimeout(t)
  }, [signature])

  // Health numbers in, refreshed on open and whenever the app comes back to the front.
  useEffect(() => {
    if (!nativeApp()) return
    const stop = onNative((msg) => {
      if (msg.type === 'health:data' && msg.data) actions.setHealth(msg.data)
      if (msg.type === 'foreground') {
        if (deviceSettings().health) sendNative({ type: 'health:refresh' })
        sendNative({ type: 'notifications:schedule', items: JSON.parse(signature) })
      }
    })
    return stop
  }, [actions, signature])

  useEffect(() => {
    if (device.health) sendNative({ type: 'health:refresh' })
  }, [device.health])

  return null
}
