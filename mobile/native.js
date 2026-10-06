// The phone-only parts of Sprout: reminders and Apple Health. The web app decides what to
// remind and asks for health numbers over a small message bridge (see App.js); this file
// does the native work.

import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'

// Show reminders even while Sprout is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
})

// ---------------------------------------------------------------- reminders

export async function notificationStatus() {
  const { status } = await Notifications.getPermissionsAsync()
  return status === 'granted'
}

export async function enableNotifications() {
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

/**
 * Replace every scheduled reminder with this list: [{ id, title, body, at }] where `at` is
 * an ISO date. iOS keeps at most 64 pending, so only the soonest are scheduled.
 */
export async function scheduleReminders(items) {
  if (!(await notificationStatus())) return 0
  await Notifications.cancelAllScheduledNotificationsAsync()
  const now = Date.now()
  const upcoming = items
    .filter((i) => new Date(i.at).getTime() > now)
    .sort((a, b) => new Date(a.at) - new Date(b.at))
    .slice(0, 60)
  for (const item of upcoming) {
    await Notifications.scheduleNotificationAsync({
      identifier: item.id,
      content: { title: item.title, body: item.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(item.at) },
    })
  }
  return upcoming.length
}

// ---------------------------------------------------------------- Apple Health

// Loaded lazily: HealthKit only exists on iOS.
const healthkit = () => (Platform.OS === 'ios' ? require('@kingstinct/react-native-healthkit') : null)

const READ = [
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierDietaryEnergyConsumed',
  'HKQuantityTypeIdentifierStepCount',
]

// Sleep stages that count as asleep (core, deep, REM, or unspecified asleep).
const ASLEEP = new Set([1, 3, 4, 5])

export function healthAvailable() {
  const hk = healthkit()
  try {
    return !!hk && hk.isHealthDataAvailable()
  } catch {
    return false
  }
}

/** Ask once for read access (iOS only shows the prompt the first time). */
export async function connectHealth() {
  const hk = healthkit()
  if (!hk) return false
  await hk.requestAuthorization({ toRead: READ })
  return true
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

async function stat(hk, id, kind, unit, startDate, endDate) {
  try {
    const res = await hk.queryStatisticsForQuantity(id, [kind], { unit, filter: { date: { startDate, endDate } } })
    const q = kind === 'cumulativeSum' ? res.sumQuantity : kind === 'mostRecent' ? res.mostRecentQuantity : res.averageQuantity
    return q ? Math.round(q.quantity * 10) / 10 : null
  } catch {
    return null
  }
}

/**
 * Today's numbers for the planner. Oura, Apple Watch and most trackers write these to
 * Apple Health; anything missing comes back as null.
 */
export async function readHealth() {
  const hk = healthkit()
  if (!hk) return null
  await hk.requestAuthorization({ toRead: READ })
  const now = new Date()
  const today = startOfDay(now)
  // Last night: from 6pm yesterday until noon today.
  const nightStart = new Date(today.getTime() - 6 * 3600 * 1000)
  const nightEnd = new Date(today.getTime() + 12 * 3600 * 1000)
  const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 3600 * 1000)

  let sleepMinutes = null
  try {
    const samples = await hk.queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
      limit: 0,
      filter: { date: { startDate: nightStart, endDate: nightEnd } },
    })
    // Several sources (Oura and a watch, say) can overlap: merge the asleep intervals.
    const spans = samples
      .filter((s) => ASLEEP.has(s.value))
      .map((s) => [new Date(s.startDate).getTime(), new Date(s.endDate).getTime()])
      .sort((a, b) => a[0] - b[0])
    let total = 0
    let cur = null
    for (const [a, b] of spans) {
      if (!cur || a > cur[1]) {
        if (cur) total += cur[1] - cur[0]
        cur = [a, b]
      } else cur[1] = Math.max(cur[1], b)
    }
    if (cur) total += cur[1] - cur[0]
    sleepMinutes = spans.length ? Math.round(total / 60000) : null
  } catch {
    sleepMinutes = null
  }

  const [hrv, hrvBaseline, restingHr, activeKcal, eatenKcal, steps] = await Promise.all([
    stat(hk, 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN', 'discreteAverage', 'ms', nightStart, nightEnd),
    stat(hk, 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN', 'discreteAverage', 'ms', twoWeeksAgo, today),
    stat(hk, 'HKQuantityTypeIdentifierRestingHeartRate', 'mostRecent', 'count/min', twoWeeksAgo, now),
    stat(hk, 'HKQuantityTypeIdentifierActiveEnergyBurned', 'cumulativeSum', 'kcal', today, now),
    stat(hk, 'HKQuantityTypeIdentifierDietaryEnergyConsumed', 'cumulativeSum', 'kcal', today, now),
    stat(hk, 'HKQuantityTypeIdentifierStepCount', 'cumulativeSum', 'count', today, now),
  ])

  return { day: dayKey(now), at: now.toISOString(), sleepMinutes, hrv, hrvBaseline, restingHr, activeKcal, eatenKcal, steps }
}
