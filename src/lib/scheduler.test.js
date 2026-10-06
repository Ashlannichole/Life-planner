import { describe, expect, it } from 'vitest'
import { addDays } from './dates.js'
import { initialState, makeTask, makeTemplate } from './model.js'
import { buildSchedule, dayAvailability, isBedFriendly } from './scheduler.js'
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

describe('why this day', () => {
  const why = (sched, taskId) => sched.days.flatMap((d) => d.items).find((i) => i.taskId === taskId)?.why

  it('explains every kind of placement in one plain line', () => {
    const trip = { id: 'trip', title: 'Portland trip', date: addDays(MON, 10) }
    const prep = task('Book lodging', { eventId: 'trip', deadline: addDays(MON, 3) })
    const daily = task('Make bed', { repeat: 'daily', minutes: 5 })
    const fun = task('Crochet', { type: 'want' })
    const weekend = task('Bake bread', { preferredTime: 'weekend', type: 'want', createdAt: 2 })
    const pinned = task('Call dentist')
    const deferred = task('Sort mail')
    const s = stateWith({
      tasks: [prep, daily, fun, weekend, pinned, deferred],
      events: [trip],
      pins: { [pinned.id]: MON },
      deferrals: { [deferred.id]: addDays(MON, 1) },
    })
    const sched = buildSchedule(s, { today: MON })
    expect(why(sched, prep.id)).toMatch(/^Prep for Portland trip, best done by /)
    expect(why(sched, daily.id)).toBe('Repeats every day')
    expect(why(sched, fun.id)).toMatch(/fun pick/)
    expect(why(sched, weekend.id)).toMatch(/weekends|fun pick/)
    expect(why(sched, pinned.id)).toBe('You pulled this into today')
    expect(why(sched, deferred.id)).toMatch(/not today/)
  })

  it('names spreading out a category as the reason', () => {
    const tasks = ['Dishes', 'Mop'].map((t, i) => task(t, { minutes: 15, category: 'cleaning', createdAt: i }))
    const sched = buildSchedule(stateWith({ tasks }), { today: MON })
    expect(why(sched, tasks[0].id)).toMatch(/room/)
    expect(why(sched, tasks[1].id)).toBe('Keeps cleaning spread out across the week')
  })
})

describe('daily routines and set-day tasks', () => {
  const SUN = addDays(MON, 6)
  const daysWith = (sched, taskId) => sched.days.filter((d) => d.items.some((i) => i.taskId === taskId)).map((d) => d.key)

  it('puts a daily task on every day, even a day with no free time', () => {
    // Free time on weekday evenings only, so Sunday has none.
    const skin = task('Skin care', { repeat: 'daily', minutes: 15, category: 'selfcare' })
    const s = stateWith({ tasks: [skin], blocks: [{ days: [1, 2, 3, 4, 5], start: '18:00', end: '21:00' }] })
    const sched = buildSchedule(s, { today: MON, horizon: 7 })
    expect(daysWith(sched, skin.id)).toHaveLength(7)
    expect(daysWith(sched, skin.id)).toContain(SUN)
  })

  it('puts a daily task on a day that is already full', () => {
    const skin = task('Skin care', { repeat: 'daily', minutes: 15 })
    const big = task('Deep clean', { minutes: 140, deadline: MON })
    const s = stateWith({ tasks: [big, skin] })
    const sched = buildSchedule(s, { today: MON, horizon: 2 })
    expect(daysWith(sched, skin.id)).toEqual([MON, addDays(MON, 1)])
  })

  it('places a task set for a specific day on that day, whatever the room', () => {
    const wed = addDays(MON, 2)
    const call = task('Call the vet', { onDate: wed, minutes: 15 })
    const filler = Array.from({ length: 12 }, (_, i) => task(`Thing ${i}`, { minutes: 30 }))
    const s = stateWith({ tasks: [...filler, call] })
    const sched = buildSchedule(s, { today: MON, horizon: 7 })
    expect(dayOf(sched, call.id)).toBe(wed)
    expect(sched.days[2].items.find((i) => i.taskId === call.id).why).toMatch(/You set this for/)
  })

  it('carries a missed set-day task over to today', () => {
    const call = task('Call the vet', { onDate: addDays(MON, -2) })
    const sched = buildSchedule(stateWith({ tasks: [call] }), { today: MON, horizon: 3 })
    expect(dayOf(sched, call.id)).toBe(MON)
  })
})

describe('days in bed (Plus)', () => {
  it('only plans things you can do lying down, and the rest waits', () => {
    const tasks = [
      task('Call the dentist', { createdAt: 1 }),
      task('Pay the phone bill', { createdAt: 2 }),
      task('Vacuum the living room', { createdAt: 3 }),
      task('Water the plants', { createdAt: 4 }),
      task('Read a chapter', { type: 'want', createdAt: 5 }),
    ]
    const sched = buildSchedule(stateWith({ tasks, energy: { [MON]: 'bed' } }), { today: MON })
    const today = sched.days[0]
    expect(today.bedDay).toBe(true)
    const titles = today.items.map((i) => i.title)
    expect(titles).not.toContain('Vacuum the living room')
    expect(titles).not.toContain('Water the plants')
    expect(titles.some((t) => /dentist|bill|chapter/.test(t))).toBe(true)
    // Nothing is dropped: the up-and-about things land on another day.
    expect(dayOf(sched, tasks[2].id)).not.toBe(MON)
    expect(dayOf(sched, tasks[2].id)).toBeTruthy()
  })

  it('lets the person decide what counts as bed-friendly', () => {
    expect(isBedFriendly({ title: 'Vacuum' })).toBe(false)
    expect(isBedFriendly({ title: 'Vacuum', bedFriendly: true })).toBe(true)
    expect(isBedFriendly({ title: 'Call Mom', bedFriendly: false })).toBe(false)
    expect(isBedFriendly({ title: 'Water the plants' })).toBe(false)
    expect(isBedFriendly({ title: 'Take a shower' })).toBe(false)
    expect(isBedFriendly({ title: 'Do cardio' })).toBe(false)
    expect(isBedFriendly({ title: 'Plan the week' })).toBe(true)
  })

  it('skips daily chores that need you up, but not ones you can do in bed', () => {
    const tasks = [task('Make bed', { repeat: 'daily', minutes: 5 }), task('Journal', { repeat: 'daily', minutes: 10 })]
    const today = buildSchedule(stateWith({ tasks, energy: { [MON]: 'bed' } }), { today: MON }).days[0]
    const titles = today.items.map((i) => i.title)
    expect(titles).toContain('Journal')
    expect(titles).not.toContain('Make bed')
  })
})
