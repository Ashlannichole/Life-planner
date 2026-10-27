// Two-way calendar sync with the iPhone's Calendar (iCloud, Google, Outlook… whatever
// accounts are on the phone). The website decides what to sync; this file reads and writes.
//
// Calendar → Sprout: events from the calendars the person picks come back as plain
//   { id, calendarId, title, date, endDate, allDay, start, end } in the phone's time zone.
// Sprout → Calendar: Sprout's own events are kept in a calendar called "Sprout". Each one
//   carries its Sprout id in its URL (sprout://event/<id>), so syncing again updates it in
//   place, and events removed in Sprout are removed there too. Nothing outside the
//   "Sprout" calendar is ever changed.

import { Platform } from 'react-native'

const SPROUT_CALENDAR = 'Sprout'
const SPROUT_COLOR = '#5d8c69'
const URL_PREFIX = 'sprout://event/'

let Calendar = null
const cal = () => {
  if (!Calendar) Calendar = require('expo-calendar/legacy')
  return Calendar
}

const pad = (n) => String(n).padStart(2, '0')
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
const fromKey = (key, time = '00:00') => {
  const [y, m, d] = key.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return new Date(y, m - 1, d, h || 0, min || 0)
}

export async function calendarStatus() {
  const { status } = await cal().getCalendarPermissionsAsync()
  return status === 'granted'
}

export async function enableCalendar() {
  const { status } = await cal().requestCalendarPermissionsAsync()
  return status === 'granted'
}

/** The phone's calendars, minus Sprout's own: [{ id, title, color, account, suggested }]. */
export async function listCalendars() {
  if (!(await calendarStatus())) return []
  const all = await cal().getCalendarsAsync(cal().EntityTypes.EVENT)
  return all
    .filter((c) => c.title !== SPROUT_CALENDAR)
    .map((c) => ({
      id: c.id,
      title: c.title,
      color: c.color || null,
      account: c.source?.name || '',
      // Holiday and birthday calendars start switched off (Sprout has its own).
      suggested: c.type !== cal().CalendarType.BIRTHDAYS && c.type !== cal().CalendarType.SUBSCRIBED && !/holiday|birthday/i.test(c.title),
    }))
}

/** Events between two day keys from the chosen calendars, one entry per occurrence. */
export async function readCalendarEvents(calendarIds, from, to) {
  if (!calendarIds?.length || !(await calendarStatus())) return []
  const events = await cal().getEventsAsync(calendarIds, fromKey(from), fromKey(to, '23:59'))
  return events
    .filter((e) => e.status !== cal().EventStatus.CANCELED && !(e.url || '').startsWith(URL_PREFIX))
    .map((e) => {
      const start = new Date(e.startDate)
      // All-day events end at midnight after their last day (or a second before it).
      const end = new Date(new Date(e.endDate).getTime() - (e.allDay ? 1000 : 0))
      const date = dayKey(start)
      const last = dayKey(end)
      return {
        // Repeating events share an id; the start keeps each occurrence apart.
        id: `cal:${e.id}:${start.getTime()}`,
        calendarId: e.calendarId,
        title: e.title || 'Busy',
        date,
        endDate: last > date ? last : null,
        allDay: !!e.allDay,
        start: e.allDay ? null : hhmm(start),
        end: e.allDay ? null : hhmm(end),
        location: e.location || null,
      }
    })
}

async function sproutCalendarId() {
  const all = await cal().getCalendarsAsync(cal().EntityTypes.EVENT)
  const existing = all.find((c) => c.title === SPROUT_CALENDAR && c.allowsModifications)
  if (existing) return existing.id
  const def = Platform.OS === 'ios' ? await cal().getDefaultCalendarAsync() : null
  return cal().createCalendarAsync({
    title: SPROUT_CALENDAR,
    name: SPROUT_CALENDAR,
    color: SPROUT_COLOR,
    entityType: cal().EntityTypes.EVENT,
    sourceId: def?.source?.id,
    source: def?.source,
    ownerAccount: 'personal',
    accessLevel: cal().CalendarAccessLevel.OWNER,
  })
}

function details(ev) {
  const last = ev.endDate || ev.date
  const startDate = ev.allDay ? fromKey(ev.date) : fromKey(ev.date, ev.start || '09:00')
  let endDate = ev.allDay ? fromKey(last, '23:59') : fromKey(last, ev.end || ev.start || '10:00')
  if (endDate <= startDate) endDate = new Date(startDate.getTime() + 30 * 60 * 1000)
  return {
    title: ev.title || 'Event',
    startDate,
    endDate,
    allDay: !!ev.allDay,
    url: `${URL_PREFIX}${ev.id}`,
    notes: 'Added by Sprout. Change it in Sprout and it updates here.',
  }
}

const sameEvent = (a, b) =>
  a.title === b.title && a.allDay === b.allDay && new Date(a.startDate).getTime() === b.startDate.getTime() && new Date(a.endDate).getTime() === b.endDate.getTime()

/**
 * Make the "Sprout" calendar match Sprout's events between two day keys: add new ones,
 * update changed ones, remove ones that are gone. Returns how many changed.
 */
export async function writeSproutEvents(events, from, to) {
  if (!(await calendarStatus())) return 0
  const calendarId = await sproutCalendarId()
  const existing = await cal().getEventsAsync([calendarId], fromKey(from), fromKey(to, '23:59'))
  const byId = new Map()
  for (const e of existing) {
    if ((e.url || '').startsWith(URL_PREFIX)) byId.set(e.url.slice(URL_PREFIX.length), e)
  }
  let changed = 0
  const keep = new Set()
  for (const ev of events) {
    keep.add(ev.id)
    const want = details(ev)
    const have = byId.get(ev.id)
    if (!have) {
      await cal().createEventAsync(calendarId, want)
      changed++
    } else if (!sameEvent(have, want)) {
      await cal().updateEventAsync(have.id, want)
      changed++
    }
  }
  for (const [id, e] of byId) {
    if (keep.has(id)) continue
    await cal().deleteEventAsync(e.id)
    changed++
  }
  return changed
}
