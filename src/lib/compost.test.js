import { describe, expect, it } from 'vitest'
import { addDays } from './dates.js'
import { COMPOST_AFTER, addPush, compostPile, planSnapshot, rollPushes } from './compost.js'
import { initialState, makeTask } from './model.js'
import { buildSchedule } from './scheduler.js'

const MON = '2026-09-28'

describe('compost pile', () => {
  it('moves a task to the pile after being pushed enough times', () => {
    let tasks = [makeTask({ title: 'Clean garage' })]
    for (let i = 0; i < COMPOST_AFTER - 1; i++) tasks = addPush(tasks, tasks[0].id)
    expect(tasks[0].compost).toBe(false)
    tasks = addPush(tasks, tasks[0].id)
    expect(tasks[0].compost).toBe(true)
    expect(compostPile({ tasks })).toHaveLength(1)
  })

  it('never composts repeating tasks', () => {
    let tasks = [makeTask({ title: 'Dishes', repeat: 'daily' })]
    for (let i = 0; i < 10; i++) tasks = addPush(tasks, tasks[0].id)
    expect(tasks[0].pushes).toBeUndefined()
  })

  it('counts a push when a new day starts with yesterday’s task undone', () => {
    const done = makeTask({ title: 'Done one', doneAt: MON })
    const open = makeTask({ title: 'Open one' })
    const state = { ...initialState(), tasks: [done, open], planSnapshot: { date: MON, ids: [done.id, open.id] } }
    expect(rollPushes(state, MON)).toBe(state) // same day: nothing yet
    const next = rollPushes(state, addDays(MON, 1))
    expect(next.tasks.find((t) => t.id === open.id).pushes).toBe(1)
    expect(next.tasks.find((t) => t.id === done.id).pushes).toBeUndefined()
    expect(next.planSnapshot).toBeNull()
  })

  it('keeps composted tasks out of the plan', () => {
    const t = { ...makeTask({ title: 'Clean garage' }), compost: true }
    const s = { ...initialState(), tasks: [t] }
    const sched = buildSchedule(s, { today: MON })
    expect(sched.days.some((d) => d.items.length)).toBe(false)
    expect(planSnapshot(sched, MON).ids).toEqual([])
  })
})
