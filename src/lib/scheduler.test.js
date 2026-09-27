import { describe, expect, it } from 'vitest'
import { addDays } from './dates.js'
import { initialState, makeTask, makeTemplate } from './model.js'
import { buildSchedule, dayAvailability } from './scheduler.js'
import { makePrepTasks, prepDates, reschedulePrepTasks } from './prep.js'

// 2026-09-28 is a Monday.
const MON = '2026-09-28'

function stateWith({ tasks = [], events = [], blocks, ...rest } = {}) {
  const s = initialState()
  const template = makeTemplate('Test', blocks || [{ days: [0, 1, 2, 3, 4, 5, 6], start: '18:00', end: '21:00' }])
  return { ...s, templates: [template], activeTemplateId: template.id, tasks, events, ...rest }
}

const task = (title, fields = {}) => makeTask({ title, startDate: MON, createdAt: 1, ...fields })
const dayOf = (sched, taskId) => sched.days.find((d) => d.items.some((i) => i.taskId === taskId))?.key

describe('availability', () => {
  it('leaves a 20% buffer and removes event time', () => {
    const s = stateWith()
    const plain = dayAvailability(s.templates[0], [], MON, 0.2)
    expect(plain.freeMinutes).toBe(180)
    expect(plain.capacity).toBe(144)

    const ev = { id: 'e', date: MON, start: '18:00', end: '19:00' }
    const busy = dayAvailability(s.templates[0], [ev], MON, 0.2)
    expect(busy.freeMinutes).toBe(120)
    // Busy days get lighter plans on top of the lost time.
    expect(busy.capacity).toBeLessThan(120 * 0.8)
  })

  it('treats all-day and multi-day events as fully busy', () => {
    const s = stateWith()
    const trip = { id: 'e', date: MON, endDate: addDays(MON, 2), allDay: true }
    expect(dayAvailability(s.templates[0], [trip], addDays(MON, 1)).capacity).toBe(0)
    expect(dayAvailability(s.templates[0], [trip], addDays(MON, 3)).capacity).toBeGreaterThan(0)
  })
})

describe('buildSchedule', () => {
  it('schedules tasks from today onward, so unfinished ones roll over', () => {
    const t = task('Vacuum', { minutes: 30 })
    const s = stateWith({ tasks: [t] })
    expect(dayOf(buildSchedule(s, { today: MON }), t.id)).toBe(MON)
    // A day later, with nothing checked off, it simply shows up on the new today.
    const tue = addDays(MON, 1)
    expect(dayOf(buildSchedule(s, { today: tue }), t.id)).toBe(tue)
  })

  it('never schedules on a day with no free time', () => {
    const t = task('Vacuum')
    const s = stateWith({ tasks: [t], events: [{ id: 'e', date: MON, allDay: true }] })
    expect(dayOf(buildSchedule(s, { today: MON }), t.id)).toBe(addDays(MON, 1))
  })

  it('puts at least one want-to task on each day with room', () => {
    const needs = Array.from({ length: 20 }, (_, i) => task(`Chore ${i}`, { minutes: 30, createdAt: i }))
    const wants = Array.from({ length: 7 }, (_, i) => task(`Fun ${i}`, { type: 'want', minutes: 30, createdAt: 100 + i }))
    const sched = buildSchedule(stateWith({ tasks: [...needs, ...wants] }), { today: MON })
    for (const day of sched.days.slice(0, 7)) {
      expect(day.items.some((i) => i.type === 'want')).toBe(true)
    }
  })

  it('does not overfill a day past its capacity', () => {
    const tasks = Array.from({ length: 30 }, (_, i) => task(`Chore ${i}`, { minutes: 30, createdAt: i }))
    const sched = buildSchedule(stateWith({ tasks }), { today: MON })
    for (const day of sched.days) expect(day.planned).toBeLessThanOrEqual(day.capacity)
  })

  it('spreads tasks of the same category across the week', () => {
    const tasks = ['Dishes', 'Mop', 'Dust'].map((title, i) =>
      task(title, { minutes: 15, category: 'cleaning', createdAt: i }),
    )
    const sched = buildSchedule(stateWith({ tasks }), { today: MON })
    const days = new Set(tasks.map((t) => dayOf(sched, t.id)))
    expect(days.size).toBe(3)
  })

  it('places deadline tasks on or before their deadline', () => {
    const fillers = Array.from({ length: 12 }, (_, i) => task(`Filler ${i}`, { minutes: 60, createdAt: i }))
    const due = task('Renew license', { deadline: addDays(MON, 2), minutes: 30, createdAt: 99 })
    const sched = buildSchedule(stateWith({ tasks: [...fillers, due] }), { today: MON })
    expect(dayOf(sched, due.id) <= addDays(MON, 2)).toBe(true)
  })

  it('schedules a past-deadline task as soon as possible instead of dropping it', () => {
    const late = task('Book flights', { deadline: addDays(MON, -3), notBefore: addDays(MON, -10) })
    expect(dayOf(buildSchedule(stateWith({ tasks: [late] }), { today: MON }), late.id)).toBe(MON)
  })

  it('respects weekend preference', () => {
    const t = task('Bake bread', { type: 'want', preferredTime: 'weekend', minutes: 90 })
    const sched = buildSchedule(stateWith({ tasks: [t] }), { today: MON })
    expect(['2026-10-03', '2026-10-04']).toContain(dayOf(sched, t.id))
  })

  it('respects preferred part of day when it has room', () => {
    const blocks = [{ days: [0, 1, 2, 3, 4, 5, 6], start: '08:00', end: '20:00' }]
    const t = task('Run', { preferredTime: 'morning' })
    const sched = buildSchedule(stateWith({ tasks: [t], blocks }), { today: MON })
    expect(sched.days[0].items[0].part).toBe('morning')
  })

  it('repeats daily tasks once per day without stacking missed ones', () => {
    const t = task('Make bed', { repeat: 'daily', minutes: 5, startDate: addDays(MON, -5) })
    const sched = buildSchedule(stateWith({ tasks: [t] }), { today: MON, horizon: 7 })
    for (const day of sched.days) {
      expect(day.items.filter((i) => i.taskId === t.id)).toHaveLength(1)
    }
  })

  it('bases the next repeat on the last completion', () => {
    const t = task('Water plants', { repeat: 'everyX', everyDays: 3, minutes: 5 })
    const s = stateWith({
      tasks: [t],
      completions: [{ id: 'c', taskId: t.id, date: MON, minutes: 5, type: 'need' }],
    })
    const sched = buildSchedule(s, { today: MON, horizon: 7 })
    const days = sched.days.filter((d) => d.items.some((i) => i.taskId === t.id)).map((d) => d.key)
    expect(days[0]).toBe(addDays(MON, 3))
  })

  it('counts work already done today against today', () => {
    const t = task('Tidy', { minutes: 30 })
    const s = stateWith({
      tasks: [t],
      completions: [{ id: 'c', taskId: 'x', date: MON, minutes: 144, type: 'need' }],
    })
    expect(dayOf(buildSchedule(s, { today: MON }), t.id)).toBe(addDays(MON, 1))
  })

  it('honours pins and "not today" deferrals', () => {
    const a = task('A')
    const b = task('B')
    const s = stateWith({
      tasks: [a, b],
      pins: { [a.id]: addDays(MON, 4) },
      deferrals: { [b.id]: addDays(MON, 1) },
    })
    const sched = buildSchedule(s, { today: MON })
    expect(dayOf(sched, a.id)).toBe(addDays(MON, 4))
    expect(dayOf(sched, b.id)).toBe(addDays(MON, 1))
  })

  it('applies manual order within a day', () => {
    const a = task('A', { minutes: 15 })
    const b = task('B', { minutes: 15, type: 'want' })
    const s = stateWith({ tasks: [a, b], pins: { [a.id]: MON, [b.id]: MON }, dayOrder: { [MON]: [b.id, a.id] } })
    expect(buildSchedule(s, { today: MON }).days[0].items.map((i) => i.taskId)).toEqual([b.id, a.id])
  })

  it('rebalances when an event is added', () => {
    const tasks = Array.from({ length: 4 }, (_, i) => task(`T${i}`, { minutes: 60, createdAt: i }))
    const before = buildSchedule(stateWith({ tasks }), { today: MON })
    expect(before.days[0].items.length).toBeGreaterThan(0)
    const after = buildSchedule(stateWith({ tasks, events: [{ id: 'e', date: MON, allDay: true }] }), {
      today: MON,
    })
    expect(after.days[0].items).toHaveLength(0)
    for (const t of tasks) expect(dayOf(after, t.id)).toBeDefined()
  })
})

describe('event prep', () => {
  it('schedules prep backward from the event date', () => {
    expect(prepDates('2026-11-20', 42)).toEqual({ deadline: '2026-10-09', notBefore: '2026-10-02' })
    expect(prepDates('2026-11-20', 1)).toEqual({ deadline: '2026-11-19', notBefore: '2026-11-19' })
  })

  it('moves unfinished prep tasks when the event moves', () => {
    const ev = { id: 'trip', date: '2026-11-20' }
    const tasks = makePrepTasks(ev, [{ title: 'Pack', daysBefore: 1, minutes: 60 }])
    const moved = reschedulePrepTasks(tasks, { ...ev, date: '2026-11-27' })
    expect(moved[0].deadline).toBe('2026-11-26')
  })
})

describe('low-energy days', () => {
  it('plans a lighter day', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => task(`T${i}`, { minutes: 15, createdAt: i }))
    const normal = buildSchedule(stateWith({ tasks }), { today: MON }).days[0]
    const low = buildSchedule(stateWith({ tasks, energy: { [MON]: 'low' } }), { today: MON }).days[0]
    expect(low.lowEnergy).toBe(true)
    expect(low.capacity).toBe(Math.floor(normal.capacity * 0.6))
    expect(low.planned).toBeLessThan(normal.planned)
  })
})
