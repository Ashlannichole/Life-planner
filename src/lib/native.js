// Talking to the Sprout iPhone app. The website runs inside it; the app tells us which
// phone features it has (window.SproutNative) and we send it small JSON messages:
// reminders to schedule, Apple Health numbers to read. In a normal browser none of this
// exists and everything here quietly does nothing.

const DEVICE_KEY = 'sprout.device'

export function nativeApp() {
  if (typeof window === 'undefined' || !window.ReactNativeWebView) return null
  return window.SproutNative || null
}

export const hasNativeFeature = (feature) => !!nativeApp()?.features?.includes(feature)

export function sendNative(message) {
  if (!nativeApp()) return false
  window.ReactNativeWebView.postMessage(JSON.stringify(message))
  return true
}

/** Listen for answers from the app ({ type, ... }). Returns an unsubscribe function. */
export function onNative(handler) {
  const listener = (e) => handler(e.detail || {})
  window.addEventListener('sprout-native', listener)
  return () => window.removeEventListener('sprout-native', listener)
}

/** Ask the app something and wait for the answer of a given type (or null after a while). */
export function askNative(message, answerType, timeout = 20000) {
  return new Promise((resolve) => {
    if (!sendNative(message)) return resolve(null)
    const stop = onNative((msg) => {
      if (msg.type !== answerType) return
      stop()
      clearTimeout(timer)
      resolve(msg)
    })
    const timer = setTimeout(() => {
      stop()
      resolve(null)
    }, timeout)
  })
}

// Choices that belong to this phone, not the account (permissions are per device).
export function deviceSettings() {
  try {
    return JSON.parse(localStorage.getItem(DEVICE_KEY)) || {}
  } catch {
    return {}
  }
}

export function setDeviceSettings(fields) {
  const next = { ...deviceSettings(), ...fields }
  try {
    localStorage.setItem(DEVICE_KEY, JSON.stringify(next))
  } catch {
    // Private mode: it just asks again next time.
  }
  window.dispatchEvent(new CustomEvent('sprout-device-change', { detail: next }))
  return next
}
