// Workouts shared by the Rung workout app (same account, `scheduled_workouts`
// table). The planner plans the rest of each day around them, and a finished
// workout waters the plant like any other finished task.

import { addDays } from './dates.js'
import { applyMilestones } from './milestones.js'
import { water } from './plant.js'

export const PAST_DAYS = 7
export const FUTURE_DAYS = 13

export function workoutWindow(today) {
  return { from: addDays(today, -PAST_DAYS), to: addDays(today, FUTURE_DAYS) }
}

export async function fetchWorkouts(client, userId, { from, to }) {
  const { data, error } = await client
    .from('scheduled_workouts')
    .select('date, title, duration_min, done')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)
  if (error) throw error
  return data || []
}

export const workoutCompletionId = (date) => `workout-${date}`

/**
 * Store the latest workouts and record finished ones. Each finished workout
 * becomes one check-off (so it shows in recaps and milestones) and waters the
 * plant once. Returns the new state and anything worth celebrating.
 */
export function applyWorkouts(state, rows, today) {
  const workouts = {}
  for (const r of rows) {
    workouts[r.date] = { title: r.title, minutes: Number(r.duration_min) || 45, done: !!r.done }
  }
  let next = { ...state, workouts }
  const plantEvents = []
  const have = new Set(state.completions.map((c) => c.id))
  for (const r of rows) {
    const id = workoutCompletionId(r.date)
    if (!r.done || r.date > today || have.has(id)) continue
    const watered = water(next.plant, today)
    plantEvents.push({ events: watered.events, plant: watered.plant })
    next = {
      ...next,
      plant: watered.plant,
      completions: [
        ...next.completions,
        {
          id,
          occKey: `workout:${r.date}`,
          taskId: 'workout',
          date: r.date,
          at: Date.now(),
          title: r.title,
          type: 'need',
          minutes: Number(r.duration_min) || 45,
          category: 'selfcare',
          eventId: null,
          fromWorkoutApp: true,
        },
      ],
    }
  }
  if (!plantEvents.length) return { state: next, plantEvents, reached: [] }
  const { state: withMilestones, reached } = applyMilestones(next, today)
  return { state: withMilestones, plantEvents, reached }
}

/** Minutes of not-yet-done workouts per day, so the scheduler plans less around them. */
export function workoutMinutesByDay(state) {
  const out = {}
  for (const [date, w] of Object.entries(state.workouts || {})) {
    if (!w.done) out[date] = w.minutes
  }
  return out
}
