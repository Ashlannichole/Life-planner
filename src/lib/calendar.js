// Two-way sync with the phone's calendar (iPhone app; see mobile/calendar.js).
//
// - Events from the calendars you pick are kept in `state.calendar.events`. They show up
//   everywhere Sprout's own events do and the plan works around them, but they're changed in
//   the Calendar app, not here. They sync to the account, so the website sees them too.
// - Sprout's own events are copied into a "Sprout" calendar on the phone.
// Which calendars to read is a per-phone choice (calendar ids differ between devices).

import { addDays } from './dates.js'

export const PAST_DAYS = 7
export const FUTURE_DAYS = 90

export function calendarWindow(today) {
  return { from: addDays(today, -PAST_DAYS), to: addDays(today, FUTURE_DAYS) }
}

/** Events read from the phone's calendars, marked so the app treats them as read-only. */
export function calendarEvents(state) {
  return (state.calendar?.events || []).map((e) => ({ ...e, fromCalendar: true }))
}

/** Sprout's own events plus calendar events: what the plan works around. */
export function allEvents(state) {
  const fromCalendar = calendarEvents(state)
  return fromCalendar.length ? [...state.events, ...fromCalendar] : state.events
}

/** Sprout's events in the window, in the shape the phone writes to its "Sprout" calendar. */
export function sproutEventsToWrite(state, { from, to }) {
  return state.events
    .filter((e) => (e.endDate || e.date) >= from && e.date <= to)
    .map((e) => ({ id: e.id, title: e.title, date: e.date, endDate: e.endDate || null, allDay: !!e.allDay, start: e.start || null, end: e.end || null }))
}

/** Keep only the fields Sprout needs from an event read off the phone. */
function clean(e) {
  return {
    id: String(e.id),
    calendarId: e.calendarId || null,
    title: String(e.title || 'Busy').slice(0, 200),
    date: e.date,
    endDate: e.endDate || null,
    allDay: !!e.allDay,
    start: e.allDay ? null : e.start,
    end: e.allDay ? null : e.end,
  }
}

const DAY = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^\d{2}:\d{2}$/

/** Replace the calendar events with a fresh read. Returns the same state when nothing changed. */
export function applyCalendarEvents(state, events, at = Date.now()) {
  const fresh = (events || [])
    .filter((e) => e && DAY.test(e.date) && (e.allDay || (TIME.test(e.start) && TIME.test(e.end))))
    .map(clean)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.start || '').localeCompare(b.start || '') || a.id.localeCompare(b.id))
  if (JSON.stringify(fresh) === JSON.stringify(state.calendar?.events || [])) return state
  return { ...state, calendar: { events: fresh, at } }
}

/** Turned off: forget the calendar events (Sprout's copy in the phone's calendar stays). */
export function clearCalendarEvents(state) {
  return state.calendar?.events?.length ? { ...state, calendar: { events: [], at: Date.now() } } : state
}
