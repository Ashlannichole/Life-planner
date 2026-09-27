// The compost pile: one-off tasks that keep getting pushed land here, out of
// the plan, so they can be looked at honestly instead of silently rolling
// forward forever. A push is either an explicit "not today" / move to a later
// day, or a day ending with the task still on that day's plan.

export const COMPOST_AFTER = 5

const isOneOff = (task) => task && (!task.repeat || task.repeat === 'none') && !task.doneAt

/** Count one push. The task moves to the compost pile when it reaches the limit. */
export function addPush(tasks, taskId) {
  return tasks.map((t) => {
    if (t.id !== taskId || !isOneOff(t) || t.compost) return t
    const pushes = (t.pushes || 0) + 1
    return { ...t, pushes, compost: pushes >= COMPOST_AFTER }
  })
}

/** Remember which one-off tasks are on today's plan, so a new day can tell what rolled over. */
export function planSnapshot(schedule, today) {
  const ids = schedule.days[0]?.items.filter((i) => i.key === i.taskId).map((i) => i.taskId) || []
  return { date: today, ids: [...new Set(ids)].sort() }
}

export function sameSnapshot(a, b) {
  return a?.date === b?.date && a?.ids.length === b?.ids.length && a.ids.every((id, i) => id === b.ids[i])
}

/** On a new day, count a push for each task that was planned for an earlier day and not done. */
export function rollPushes(state, today) {
  const snap = state.planSnapshot
  if (!snap || snap.date >= today) return state
  let tasks = state.tasks
  for (const id of snap.ids) tasks = addPush(tasks, id)
  return { ...state, tasks, planSnapshot: null }
}

export function compostPile(state) {
  return state.tasks.filter((t) => t.compost && isOneOff(t))
}
