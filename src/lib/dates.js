// All dates in the app are local "day keys" in the form YYYY-MM-DD.
// Working with strings keeps storage simple and avoids timezone surprises.

const pad = (n) => String(n).padStart(2, '0')

export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey(now = new Date()) {
  return toKey(now)
}

export function addDays(key, n) {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

export function addMonths(key, n) {
  const d = fromKey(key)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, lastDay))
  return toKey(d)
}

export function diffDays(a, b) {
  // Whole days from a to b (b - a). Uses UTC to ignore DST shifts.
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000)
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(key) {
  return fromKey(key).getDay()
}

export function isWeekend(key) {
  const d = weekday(key)
  return d === 0 || d === 6
}

/** Weeks start on Monday so the weekly recap lands on Sunday. */
export function startOfWeek(key) {
  const wd = weekday(key)
  return addDays(key, -((wd + 6) % 7))
}

export function weekDays(startKey) {
  return Array.from({ length: 7 }, (_, i) => addDays(startKey, i))
}

export function rangeKeys(from, to) {
  const out = []
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k)
  return out
}

export function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(min) {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatDay(key, today) {
  if (today) {
    const diff = diffDays(today, key)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Tomorrow'
    if (diff === -1) return 'Yesterday'
  }
  const d = fromKey(key)
  return `${WEEKDAY_SHORT[d.getDay()]} ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
}

export function formatShortDate(key) {
  const d = fromKey(key)
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
}

export function formatTime(t) {
  const min = timeToMinutes(t)
  const h = Math.floor(min / 60)
  const m = min % 60
  const suffix = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${h12}${suffix}` : `${h12}:${pad(m)}${suffix}`
}

export function formatMinutes(min) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}
