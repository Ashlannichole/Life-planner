// Gentle reminders for the phone app: a morning check-in every day, an afternoon nudge
// only on days nothing's been done yet, an evening nudge for night routines, and a
// heads-up before timed events. Built from the plan, so
// they follow it when things move; the app replaces them every time the plan changes.

import { formatTime, timeToMinutes } from './dates.js'

export const REMINDER_DEFAULTS = {
  morning: '08:30',
  afternoon: true,
  afternoonTime: '14:30',
  evening: true,
  eveningTime: '19:30',
  events: true,
  eventLead: 30,
}

// A few ways to say each one, rotated by date, so they don't blur into wallpaper.
const MORNING_TITLES = ['Good morning 🌱', 'Morning, sunshine ☀️', 'Your plant says hi 🌿', 'New day, fresh start 🌱', 'Hey you 💛']
const AFTERNOON_TITLES = ['One small win? 🌱', 'Still time for a tiny one ✨', 'A quick one before the day’s done? 🍵', 'Your plant is thirsty 💧']
const pick = (list, day) => list[Number(day.replace(/-/g, '')) % list.length]
const mins = (m) => (m >= 60 ? `${Math.round((m / 60) * 10) / 10} h` : `${m} min`)

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
  const doneOn = new Set((state.completions || []).map((c) => c.date))
  for (const day of schedule.days.slice(0, days)) {
    const items = day.items
    // Every morning, even with nothing planned: a check-in keeps Sprout part of the day.
    if (p.morning) {
      const first = items[0]
      out.push({
        id: `morning-${day.key}`,
        title: day.bedDay ? 'Bed day 🛏️' : pick(MORNING_TITLES, day.key),
        body: first
          ? `${items.length === 1 ? 'One thing' : `${items.length} things`} today, starting with ${first.title}. Nothing goes overdue.`
          : 'Nothing planned today. Enjoy it, or add one small thing.',
        at: at(day.key, timeToMinutes(p.morning)),
      })
    }
    // Mid-afternoon, only if nothing's been checked off yet that day: the smallest thing left.
    if (p.afternoon && items.length && !doneOn.has(day.key)) {
      const easiest = [...items].sort((a, b) => a.minutes - b.minutes)[0]
      out.push({
        id: `afternoon-${day.key}`,
        title: day.bedDay ? 'One from-bed thing? 🛏️' : pick(AFTERNOON_TITLES, day.key),
        body: `${easiest.title}${easiest.minutes ? ` takes about ${mins(easiest.minutes)}` : ''}. That's it, that's the whole ask.`,
        at: at(day.key, timeToMinutes(p.afternoonTime)),
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

