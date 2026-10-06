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

// One-tap prep ideas matched from the event's name, so a "Baby shower" or "Mom's birthday"
// comes with the usual to-dos and nobody has to think them up. Days before are picked so
// shipping, RSVPs and wrapping land in time.
const gift = (title = 'Order a gift', daysBefore = 10) => ({ title, daysBefore, minutes: 30, category: 'errands' })
const card = { title: 'Get a card', daysBefore: 3, minutes: 15, category: 'errands' }
const wrap = { title: 'Wrap the gift', daysBefore: 1, minutes: 15, category: 'other' }
const rsvp = { title: 'RSVP', daysBefore: 14, minutes: 5, category: 'admin' }
const outfit = { title: 'Pick out an outfit', daysBefore: 2, minutes: 15, category: 'other' }

export const EVENT_IDEAS = [
  { match: /baby ?shower|sprinkle|gender reveal/i, items: [rsvp, gift('Order a gift from the registry', 10), card, wrap] },
  { match: /bridal ?shower|bachelorette|bachelor/i, items: [rsvp, gift('Order a gift from the registry', 10), card, wrap, outfit] },
  { match: /wedding|engagement/i, items: [rsvp, gift('Order a gift from the registry', 14), card, outfit, { title: 'Book a hair or nails appointment', daysBefore: 10, minutes: 15, category: 'selfcare' }] },
  { match: /birthday|bday|b-day/i, items: [gift('Pick out a birthday gift', 7), card, wrap] },
  { match: /anniversary|valentine/i, items: [gift('Plan a gift or surprise', 7), card, { title: 'Book a reservation', daysBefore: 10, minutes: 15, category: 'admin' }] },
  { match: /graduation|grad party/i, items: [rsvp, gift('Get a graduation gift', 7), card] },
  { match: /housewarming/i, items: [gift('Pick up a housewarming gift', 3), card] },
  { match: /christmas|holiday|hanukkah|secret santa|white elephant/i, items: [gift('Buy gifts', 14), wrap, { title: 'Send holiday cards', daysBefore: 10, minutes: 60, category: 'admin' }] },
  { match: /party|potluck|bbq|barbecue|cookout|dinner at|game night/i, items: [rsvp, { title: 'Pick a dish or drinks to bring', daysBefore: 2, minutes: 30, category: 'errands' }, outfit] },
  { match: /host|hosting|dinner party/i, items: [{ title: 'Send invites', daysBefore: 14, minutes: 15, category: 'social' }, { title: 'Plan the menu', daysBefore: 5, minutes: 30, category: 'kitchen' }, { title: 'Grocery run', daysBefore: 1, minutes: 60, category: 'errands' }, { title: 'Tidy up', daysBefore: 1, minutes: 60, category: 'cleaning' }] },
  { match: /doctor|dentist|appointment|appt|checkup|check-up|vet\b/i, items: [{ title: 'Write down questions to ask', daysBefore: 1, minutes: 10, category: 'admin' }, { title: 'Find insurance card', daysBefore: 1, minutes: 5, category: 'admin' }] },
  { match: /interview/i, items: [{ title: 'Research the company', daysBefore: 2, minutes: 60, category: 'admin' }, { title: 'Practice answers', daysBefore: 1, minutes: 30, category: 'admin' }, outfit] },
  { match: /\bmov(e|ing)\b/i, items: [{ title: 'Get boxes', daysBefore: 14, minutes: 30, category: 'errands' }, { title: 'Change address', daysBefore: 7, minutes: 30, category: 'admin' }, { title: 'Pack', daysBefore: 3, minutes: 90, category: 'other' }] },
  { match: /funeral|memorial|wake/i, items: [{ title: 'Send flowers or a card', daysBefore: 3, minutes: 15, category: 'errands' }, outfit] },
]

/** Prep ideas for an event's name, without duplicates. */
export function eventIdeas(title = '') {
  const seen = new Set()
  return EVENT_IDEAS.filter((idea) => idea.match.test(title))
    .flatMap((idea) => idea.items)
    .filter((item) => !seen.has(item.title) && seen.add(item.title))
    .map((item) => ({ ...item, id: `idea-${norm(item.title).replace(/[^a-z0-9]+/g, '-')}` }))
}

/** One-tap suggestions for an event, minus anything it already has. */
export function prepSuggestions({ title = '', isTrip = false, existingTitles = [] }) {
  const have = new Set(existingTitles.map(norm))
  const ideas = [...eventIdeas(title), ...(isTrip ? EXTRA_TRIP_PREP : [])]
  const seen = new Set()
  return ideas.filter((s) => !have.has(norm(s.title)) && !seen.has(norm(s.title)) && seen.add(norm(s.title)))
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
