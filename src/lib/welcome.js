// Coming back after a while away: no pile of what was missed, just a fresh start.

import { diffDays } from './dates.js'

export const WELCOME_BACK_DAYS = 4

/**
 * Note that the app was opened today. After WELCOME_BACK_DAYS or more away, set up the
 * welcome-back card and clear the "kept getting pushed" counts, so nothing greets the
 * person with a compost pile of guilt. Returns the new state, or null when nothing changes.
 */
export function markOpened(state, today) {
  const last = state.settings.lastOpen
  if (last === today) return null
  const away = last ? diffDays(last, today) : 0
  const settings = { ...state.settings, lastOpen: today }
  if (!state.onboarded || away < WELCOME_BACK_DAYS) return { ...state, settings }
  return {
    ...state,
    settings: { ...settings, welcomeBack: { away, on: today } },
    tasks: state.tasks.map((t) => (t.pushes || t.compost ? { ...t, pushes: 0, compost: false } : t)),
  }
}
