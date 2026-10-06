import { describe, expect, it } from 'vitest'
import { buildReminders, upcomingReminders } from './reminders.js'

const day = (key, items = [], events = [], extra = {}) => ({ key, items, events, ...extra })
const item = (title, part = 'morning', minutes = 30) => ({ title, part, minutes })

describe('reminders', () => {
  const schedule = {
    days: [
      day('2026-10-06', [item('Skin care', 'morning', 10), item('Laundry', 'afternoon'), item('Skin care', 'evening', 10)], [
        { id: 'dentist', title: 'Dentist', date: '2026-10-06', start: '14:00', end: '15:00' },
        { id: 'trip', title: 'Trip', date: '2026-10-06', allDay: true },
      ]),
      day('2026-10-07', [], []),
      day('2026-10-08', [item('Call Mom')], [], { bedDay: true }),
    ],
  }

  it('makes a morning check-in, an evening nudge and event heads-ups', () => {
    const r = buildReminders({}, schedule)
    const ids = r.map((x) => x.id)
    expect(ids).toContain('morning-2026-10-06')
    expect(ids).toContain('evening-2026-10-06')
    expect(ids).toContain('event-dentist-2026-10-06')
    expect(ids).not.toContain('event-trip-2026-10-06') // all-day events don't get a timed ping
    expect(ids).toContain('morning-2026-10-07') // a check-in every morning, even with nothing planned
    expect(r.find((x) => x.id === 'morning-2026-10-07').body).toMatch(/Nothing planned/)
    expect(ids).not.toContain('afternoon-2026-10-07') // but no nudge when there's nothing to do
    const morning = r.find((x) => x.id === 'morning-2026-10-06')
    expect(morning.body).toBe('3 things today, starting with Skin care. Nothing goes overdue.')
    expect(new Date(morning.at).getHours()).toBe(8)
    expect(new Date(r.find((x) => x.id === 'event-dentist-2026-10-06').at).getHours()).toBe(13)
    expect(r.find((x) => x.id === 'morning-2026-10-08').title).toBe('Bed day 🛏️')
  })

  it('follows the person’s choices', () => {
    const r = buildReminders({}, schedule, { morning: '07:15', afternoon: false, evening: false, events: false })
    expect(r.every((x) => x.id.startsWith('morning'))).toBe(true)
    expect(new Date(r[0].at).getMinutes()).toBe(15)
  })

  it('nudges mid-afternoon with the smallest thing, only if nothing is done yet that day', () => {
    const r = buildReminders({}, schedule)
    const nudge = r.find((x) => x.id === 'afternoon-2026-10-06')
    expect(nudge.body).toMatch(/^Skin care takes about 10 min/)
    expect(new Date(nudge.at).getHours()).toBe(14)
    const afterWin = buildReminders({ completions: [{ date: '2026-10-06' }] }, schedule)
    expect(afterWin.some((x) => x.id === 'afternoon-2026-10-06')).toBe(false)
    expect(afterWin.some((x) => x.id === 'afternoon-2026-10-08')).toBe(true)
    expect(r.find((x) => x.id === 'afternoon-2026-10-08').title).toMatch(/bed/)
  })

  it('drops reminders already in the past', () => {
    const r = buildReminders({}, schedule)
    expect(upcomingReminders(r, new Date(2026, 9, 6, 12)).some((x) => x.id === 'morning-2026-10-06')).toBe(false)
  })
})
