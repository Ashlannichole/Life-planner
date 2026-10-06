// Gentle reminders for the phone app: a morning check-in with what's planned, an evening
// nudge for night routines, and a heads-up before timed events. Built from the plan, so
// they follow it when things move; the app replaces them every time the plan changes.

import { formatTime, timeToMinutes } from './dates.js'

export const REMINDER_DEFAULTS = { morning: '08:30', evening: true, eveningTime: '19:30', events: true, eventLead: 30 }

const at = (day, minutes) => {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60).toISOString()
}

const list = (items) => {
  const names = items.slice(0, 2).map((i) => i.title)
  const more = items.length - names.length
  return names.join(' and ') + (more > 0 ? ` and ${more} more` : '')
}

/** [{ id, title, body, at }] for the next `days` days of the plan. */
export function buildReminders(state, schedule, prefs = {}, days = 7) {
  const p = { ...REMINDER_DEFAULTS, ...prefs }
  const out = []
  for (const day of schedule.days.slice(0, days)) {
    const items = day.items
    if (p.morning && items.length) {
      const first = items[0]
      out.push({
        id: `morning-${day.key}`,
        title: day.bedDay ? 'Bed day 🛏️' : 'Good morning 🌱',
        body: `${items.length === 1 ? 'One thing' : `${items.length} things`} today, starting with ${first.title}. Nothing goes overdue.`,
        at: at(day.key, timeToMinutes(p.morning)),
      })
    }
    const evening = items.filter((i) => i.part === 'evening')
    if (p.evening && evening.length) {
      out.push({
        id: `evening-${day.key}`,
        title: 'This evening 🌙',
        body: `${list(evening)}. Anything left can wait for tomorrow.`,
        at: at(day.key, timeToMinutes(p.eveningTime)),
      })
    }
    if (p.events) {
      for (const e of day.events || []) {
        if (e.allDay || !e.start || e.date !== day.key) continue
        out.push({
          id: `event-${e.id}-${day.key}`,
          title: e.title,
          body: `Starts at ${formatTime(e.start)}`,
          at: at(day.key, Math.max(0, timeToMinutes(e.start) - p.eventLead)),
        })
      }
    }
  }
  return out
}

/** The same reminders, minus any already in the past. */
export function upcomingReminders(reminders, now = new Date()) {
  return reminders.filter((r) => new Date(r.at) > now)
}

