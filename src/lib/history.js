// Keeps each person's data small forever. Check-offs older than KEEP_DAYS are
// folded into tiny per-day and per-task summaries. Everything that looks back
// (the weekly recap, milestones, plant memories, repeating tasks) reads both.

import { addDays } from './dates.js'

export const KEEP_DAYS = 90
const MAX_FUN_TITLES = 5

// A day is stored compactly: { n: count, f: fun count, m: minutes, c: {category: count}, t: [fun titles] },
// with empty parts left out. `readDay` expands it for the code that uses it.
export function readDay(d = {}) {
  return { n: d.n || 0, fun: d.f || 0, min: d.m || 0, cats: { ...(d.c || {}) }, funTitles: [...(d.t || [])] }
}

function addToDay(d = {}, c) {
  const next = { ...d, n: (d.n || 0) + 1 }
  if (c.minutes) next.m = (d.m || 0) + c.minutes
  if (c.category) next.c = { ...(d.c || {}), [c.category]: ((d.c || {})[c.category] || 0) + 1 }
  if (c.type === 'want') {
    next.f = (d.f || 0) + 1
    const titles = d.t || []
    if (c.title && !titles.includes(c.title) && titles.length < MAX_FUN_TITLES) next.t = [...titles, c.title]
  }
  return next
}

/** Fold check-offs older than KEEP_DAYS into the history summary. */
export function compactHistory(state, today) {
  const cutoff = addDays(today, -KEEP_DAYS)
  const old = state.completions.filter((c) => c.date < cutoff)
  if (!old.length) return state

  const days = { ...(state.history?.days || {}) }
  const tasks = { ...(state.history?.tasks || {}) }
  for (const c of old) {
    days[c.date] = addToDay(days[c.date], c)
    const t = tasks[c.taskId] || { count: 0, last: '' }
    tasks[c.taskId] = { count: t.count + 1, last: c.date > t.last ? c.date : t.last }
  }
  return {
    ...state,
    completions: state.completions.filter((c) => c.date >= cutoff),
    history: { days, tasks },
  }
}

/** How many times a task was done, and when last, counting compacted history. */
export function taskHistory(state, taskId, recent) {
  const h = state.history?.tasks?.[taskId]
  const lastRecent = recent.reduce((m, c) => (c.date > m ? c.date : m), '')
  return {
    count: (h?.count || 0) + recent.length,
    last: h?.last && h.last > lastRecent ? h.last : lastRecent,
  }
}

/** Per-day summaries within a range, from both compacted history and recent check-offs. */
export function daySummaries(state, start, end) {
  const out = {}
  const inRange = (d) => d >= start && d <= end
  for (const [date, d] of Object.entries(state.history?.days || {})) {
    if (inRange(date)) out[date] = readDay(d)
  }
  for (const c of state.completions) {
    if (!inRange(c.date)) continue
    const d = (out[c.date] ||= { n: 0, fun: 0, min: 0, cats: {}, funTitles: [] })
    d.n += 1
    d.min += c.minutes || 0
    if (c.category) d.cats[c.category] = (d.cats[c.category] || 0) + 1
    if (c.type === 'want') {
      d.fun += 1
      if (c.title && !d.funTitles.includes(c.title)) d.funTitles.push(c.title)
    }
  }
  return out
}
