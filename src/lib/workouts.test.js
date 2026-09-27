import { describe, expect, it } from 'vitest'
import { addDays } from './dates.js'
import { initialState, makeTask, makeTemplate } from './model.js'
import { buildSchedule } from './scheduler.js'
import { applyWorkouts, workoutWindow } from './workouts.js'

const MON = '2026-09-28'
const rows = [
  { date: addDays(MON, -1), title: 'Legs', duration_min: 40, done: true },
  { date: MON, title: 'Upper body', duration_min: 45, done: false },
  { date: addDays(MON, 2), title: 'Legs', duration_min: 40, done: false },
]

describe('workouts from the Rung app', () => {
  it('covers a week back and two weeks ahead', () => {
    expect(workoutWindow(MON)).toEqual({ from: '2026-09-21', to: '2026-10-11' })
  })

  it('records a finished workout once and waters the plant', () => {
    const { state, plantEvents } = applyWorkouts(initialState(), rows, MON)
    expect(state.workouts[MON]).toEqual({ title: 'Upper body', minutes: 45, done: false })
    expect(state.completions.map((c) => c.id)).toEqual([`workout-${addDays(MON, -1)}`])
    expect(state.plant.current.water).toBe(1)
    expect(plantEvents).toHaveLength(1)
    // Seeing the same workouts again changes nothing.
    const again = applyWorkouts(state, rows, MON)
    expect(again.state.completions).toHaveLength(1)
    expect(again.state.plant.current.water).toBe(1)
  })

  it('counts a first finished workout toward milestones', () => {
    const { reached } = applyWorkouts(initialState(), rows, MON)
    expect(reached.map((m) => m.id)).toContain('first')
  })

  it('plans less on days with a workout still to do', () => {
    const template = makeTemplate('T', [{ days: [0, 1, 2, 3, 4, 5, 6], start: '18:00', end: '21:00' }])
    const tasks = Array.from({ length: 8 }, (_, i) => makeTask({ title: `T${i}`, minutes: 30, createdAt: i }))
    const base = { ...initialState(), templates: [template], activeTemplateId: template.id, tasks }
    const plain = buildSchedule(base, { today: MON }).days[0]
    const { state } = applyWorkouts(base, rows, MON)
    const withWorkout = buildSchedule(state, { today: MON }).days[0]
    expect(withWorkout.workout.title).toBe('Upper body')
    expect(withWorkout.planned).toBeLessThan(plain.planned)
    expect(withWorkout.planned + 45).toBeLessThanOrEqual(withWorkout.capacity)
  })
})
