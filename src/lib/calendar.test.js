import { describe, expect, it } from 'vitest'
import { allEvents, applyCalendarEvents, calendarWindow, clearCalendarEvents, sproutEventsToWrite } from './calendar.js'
import { mergeState } from './merge.js'
import { initialState } from './model.js'
import { buildSchedule } from './scheduler.js'

const dentist = { id: 'cal:1:100', calendarId: 'work', title: 'Dentist', date: '2026-10-28', endDate: null, allDay: false, start: '09:00', end: '17:00' }

describe('calendar sync', () => {
  it('keeps calendar events read-only and alongside Sprout events', () => {
    const s = applyCalendarEvents({ ...initialState(), events: [{ id: 'e1', title: 'Party', date: '2026-10-30', allDay: true }] }, [dentist], 5)
    expect(s.calendar).toEqual({ events: [dentist], at: 5 })
    const all = allEvents(s)
    expect(all.map((e) => e.title)).toEqual(['Party', 'Dentist'])
    expect(all[1].fromCalendar).toBe(true)
  })

  it('ignores a re-read with nothing new, and drops malformed events', () => {
    const s = applyCalendarEvents(initialState(), [dentist], 5)
    expect(applyCalendarEvents(s, [dentist], 9)).toBe(s)
    const bad = applyCalendarEvents(initialState(), [{ id: 'x', title: 'No time', date: '2026-10-28', allDay: false }, { id: 'y', date: 'soon', allDay: true }])
    expect(bad.calendar?.events ?? []).toEqual([])
  })

  it('plans around calendar events', () => {
    const base = {
      ...initialState(),
      templates: [{ id: 'n', name: 'Normal', blocks: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ days: [d], start: '09:00', end: '17:00' })) }],
      activeTemplateId: 'n',
    }
    const before = buildSchedule(base, { today: '2026-10-28' }).days[0]
    const after = buildSchedule(applyCalendarEvents(base, [dentist]), { today: '2026-10-28' }).days[0]
    expect(after.events.map((e) => e.title)).toEqual(['Dentist'])
    expect(after.freeMinutes).toBeLessThan(before.freeMinutes)
  })

  it('shows all-day calendar entries without clearing the day', () => {
    const base = {
      ...initialState(),
      templates: [{ id: 'n', name: 'Normal', blocks: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ days: [d], start: '09:00', end: '17:00' })) }],
      activeTemplateId: 'n',
    }
    const holiday = { id: 'cal:h:1', title: 'Halloween', date: '2026-10-31', allDay: true }
    const day = buildSchedule(applyCalendarEvents(base, [holiday]), { today: '2026-10-31' }).days[0]
    expect(day.events.map((e) => e.title)).toEqual(['Halloween'])
    expect(day.freeMinutes).toBe(buildSchedule(base, { today: '2026-10-31' }).days[0].freeMinutes)
  })

  it('writes only Sprout’s own events in the window to the phone', () => {
    const s = applyCalendarEvents(
      {
        ...initialState(),
        events: [
          { id: 'old', title: 'Old', date: '2026-01-01' },
          { id: 'soon', title: 'Trip', date: '2026-11-02', endDate: '2026-11-05', allDay: true },
        ],
      },
      [dentist],
    )
    const out = sproutEventsToWrite(s, calendarWindow('2026-10-28'))
    expect(out.map((e) => e.id)).toEqual(['soon'])
    expect(out[0]).toMatchObject({ endDate: '2026-11-05', allDay: true })
  })

  it('syncs the newest calendar read between devices', () => {
    const base = initialState()
    const phone = applyCalendarEvents(base, [dentist], 10)
    expect(mergeState(base, base, phone).calendar.events).toEqual([dentist])
    expect(mergeState(base, phone, clearCalendarEvents(phone)).calendar.events).toEqual([])
  })
})
