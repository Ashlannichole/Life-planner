import { describe, expect, it } from 'vitest'
import { LIBRARY, hasTask, libraryGroups, tasksFromLibrary } from './library.js'
import { CATEGORIES, initialState, makeTemplate } from './model.js'
import { buildSchedule } from './scheduler.js'

const MON = '2026-09-28'
const byTitle = (title) => LIBRARY.find((e) => e.title === title)

describe('starter library', () => {
  it('maps every entry onto a known category', () => {
    for (const e of LIBRARY) expect(CATEGORIES.some((c) => c.id === e.category)).toBe(true)
    expect(byTitle('Skincare routine').category).toBe('selfcare')
    expect(libraryGroups().map((g) => g.id)).toEqual(['cleaning', 'laundry', 'kitchen', 'admin', 'pets', 'selfcare'])
  })

  it('translates frequencies into repeats', () => {
    const [daily, biweekly, seasonal, monthly] = tasksFromLibrary(
      [byTitle('Dishes'), byTitle('Wipe baseboards'), byTitle('Wash curtains'), byTitle('Pay bills')],
      MON,
    )
    expect(daily).toMatchObject({ repeat: 'daily', minutes: 10, category: 'cleaning', type: 'need' })
    expect(biweekly).toMatchObject({ repeat: 'everyX', everyDays: 14 })
    expect(seasonal).toMatchObject({ repeat: 'everyX', everyDays: 90 })
    expect(monthly).toMatchObject({ repeat: 'monthly', minutes: 20 })
  })

  it('spreads out the first date of less frequent chores', () => {
    const monthly = LIBRARY.filter((e) => e.frequency === 'monthly')
    const tasks = tasksFromLibrary(monthly, MON)
    const starts = new Set(tasks.map((t) => t.startDate))
    expect(starts.size).toBeGreaterThan(monthly.length / 2)
    for (const t of tasks) expect(t.startDate >= MON && t.startDate < '2026-10-26').toBe(true)
    const daily = tasksFromLibrary([byTitle('Dishes')], MON)[0]
    expect(daily.startDate).toBe(MON)
  })

  it('schedules the whole library without overfilling any day', () => {
    const template = makeTemplate('T', [
      { days: [1, 2, 3, 4, 5], start: '17:30', end: '21:00' },
      { days: [0, 6], start: '10:00', end: '16:00' },
    ])
    const state = { ...initialState(), templates: [template], activeTemplateId: template.id, tasks: tasksFromLibrary(LIBRARY, MON) }
    const sched = buildSchedule(state, { today: MON })
    for (const day of sched.days) expect(day.planned).toBeLessThanOrEqual(day.capacity)
    expect(sched.days[0].items.length).toBeGreaterThan(3)
  })

  it('recognizes tasks that are already on the list', () => {
    expect(hasTask([{ title: ' dishes ' }], 'Dishes')).toBe(true)
    expect(hasTask([{ title: 'Dishes', doneAt: '2026-09-01' }], 'Dishes')).toBe(false)
  })
})
