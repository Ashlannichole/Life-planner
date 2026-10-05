import { addDays, diffDays } from './dates.js'
import { BUILT_IN_PREP, makeTask, uid } from './model.js'

/** Built-ins first, unless the person saved their own version under the same id. */
export function allPrepTemplates(state) {
  const own = state.prepTemplates || []
  const overridden = new Set(own.map((t) => t.id))
  return [...BUILT_IN_PREP.filter((t) => !overridden.has(t.id)), ...own]
}

// Extra prep people often forget before a trip, offered as one-tap chips so
// nobody has to think up the list or decide how early to do each one.
export const EXTRA_TRIP_PREP = [
  { id: 'xp-passport', title: 'Check passport / ID', daysBefore: 30, minutes: 15, category: 'admin' },
  { id: 'xp-mail', title: 'Hold mail / packages', daysBefore: 5, minutes: 15, category: 'admin' },
  { id: 'xp-toiletries', title: 'Buy travel-size toiletries', daysBefore: 5, minutes: 30, category: 'errands' },
  { id: 'xp-meds', title: 'Refill prescriptions', daysBefore: 7, minutes: 15, category: 'errands' },
  { id: 'xp-checkin', title: 'Check in / print boarding pass', daysBefore: 1, minutes: 15, category: 'admin' },
  { id: 'xp-downloads', title: 'Download maps, shows & music', daysBefore: 1, minutes: 15, category: 'other' },
  { id: 'xp-charge', title: 'Charge devices & pack chargers', daysBefore: 1, minutes: 5, category: 'other' },
  { id: 'xp-fridge', title: 'Clear out the fridge', daysBefore: 1, minutes: 15, category: 'kitchen' },
  { id: 'xp-trash', title: 'Take out the trash', daysBefore: 0, minutes: 5, category: 'cleaning' },
]

// Plain-language "when" choices for a new prep task, so it's a tap rather
// than a number to work out.
export const PREP_WHEN = [
  { label: 'Day before', daysBefore: 1 },
  { label: 'A few days before', daysBefore: 3 },
  { label: 'A week before', daysBefore: 7 },
  { label: 'A few weeks before', daysBefore: 21 },
]

const norm = (s) => s.trim().toLowerCase()

/** Suggestions not already on this event (or picked for it). Trips only. */
export function prepSuggestions(isTrip, existingTitles) {
  if (!isTrip) return []
  const have = new Set(existingTitles.map(norm))
  return EXTRA_TRIP_PREP.filter((s) => !have.has(norm(s.title)))
}

/**
 * Keep a new prep task's deadline from landing in the past when the event is
 * close, e.g. "a week before" a trip that's in 3 days becomes "by today".
 */
export function fitDaysBefore(today, eventDate, daysBefore) {
  return Math.max(0, Math.min(daysBefore, diffDays(today, eventDate)))
}

/** A template with extra items added (skipping duplicates), for "every future trip". */
export function templateWithItems(template, items) {
  const have = new Set(template.items.map((i) => norm(i.title)))
  const extra = items.filter((i) => !have.has(norm(i.title))).map((i) => ({ ...i, id: uid() }))
  return { ...template, builtIn: false, items: [...template.items, ...extra] }
}

export function findPrepTemplate(state, id) {
  return allPrepTemplates(state).find((t) => t.id === id) || null
}

// How many days before its deadline a prep task may be started. Far-off prep
// (booking flights) gets a week of wiggle room; last-minute prep (packing)
// stays close to the event.
export function prepWindow(daysBefore) {
  if (daysBefore <= 2) return 0
  return Math.min(7, Math.ceil(daysBefore / 4))
}

export function prepDates(eventDate, daysBefore) {
  const deadline = addDays(eventDate, -daysBefore)
  return { deadline, notBefore: addDays(deadline, -prepWindow(daysBefore)) }
}

/** Create scheduler tasks for the chosen prep items of an event. */
export function makePrepTasks(event, items) {
  return items.map((item) =>
    makeTask({
      title: item.title,
      type: 'need',
      minutes: item.minutes || 30,
      category: item.category || null,
      eventId: event.id,
      prepDaysBefore: item.daysBefore,
      ...prepDates(event.date, item.daysBefore),
    }),
  )
}

/** When an event moves, shift its unfinished prep tasks with it. */
export function reschedulePrepTasks(tasks, event) {
  return tasks.map((t) =>
    t.eventId === event.id && !t.doneAt && t.prepDaysBefore != null
      ? { ...t, ...prepDates(event.date, t.prepDaysBefore) }
      : t,
  )
}

export function daysUntil(today, key) {
  return diffDays(today, key)
}
