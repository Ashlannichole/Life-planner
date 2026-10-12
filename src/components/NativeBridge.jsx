import { useEffect, useMemo, useState } from 'react'
import { deviceSettings, hasNativeFeature, nativeApp, onNative, sendNative } from '../lib/native.js'
import { buildReminders } from '../lib/reminders.js'
import { widgetData } from '../lib/widget.js'
import { useStore } from '../store.jsx'

/**
 * Inside the iPhone app: keeps the phone's reminders in step with the plan and brings in
 * Apple Health numbers. Renders nothing; does nothing in a normal browser.
 */
export default function NativeBridge() {
  const { state, schedule, today, actions, cloud } = useStore()
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

  // The home-screen widget: today's next few things, what's done, and the plant.
  const widget = useMemo(() => JSON.stringify(widgetData(state, schedule, today)), [state, schedule, today])
  useEffect(() => {
    if (!hasNativeFeature('widget')) return
    const t = setTimeout(() => sendNative({ type: 'widget:update', ...JSON.parse(widget) }), 800)
    return () => clearTimeout(t)
  }, [widget])

  // Sprout Plus bought in the app: tie it to the account and keep the status in step.
  const userId = cloud.user?.id || null
  useEffect(() => {
    if (!hasNativeFeature('purchases')) return
    const stop = onNative((msg) => {
      if (msg.type === 'plus:status' && msg.status) actions.setPlusStatus(msg.status)
    })
    sendNative({ type: 'plus:hello', userId })
    return stop
  }, [userId, actions])

  return null
}
