import { addDays, diffDays } from './dates.js'
import { BUILT_IN_PREP, makeTask } from './model.js'

export function allPrepTemplates(state) {
  return [...BUILT_IN_PREP, ...(state.prepTemplates || [])]
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
