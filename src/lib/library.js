// Starter task library: common chores people can tap to add instead of typing.

import seed from '../data/seed-tasks.json'
import { addDays } from './dates.js'
import { categoryById, makeTask } from './model.js'

// The library's categories mapped onto the app's. "personal" is self-care here.
const CATEGORY_MAP = { personal: 'selfcare' }

// Library frequencies onto the app's repeat options.
function repeatFor(frequency) {
  switch (frequency) {
    case 'daily':
    case 'weekly':
    case 'monthly':
      return { repeat: frequency }
    default: {
      const days = seed.frequencyToDays[frequency]
      return days ? { repeat: 'everyX', everyDays: days } : { repeat: 'none' }
    }
  }
}

function intervalDays(entry) {
  return seed.frequencyToDays[entry.frequency] || 0
}

export const LIBRARY = seed.seedTasks.map((entry, index) => ({
  ...entry,
  index,
  category: CATEGORY_MAP[entry.category] || entry.category,
}))

/** Library entries grouped by category, in the order they first appear. */
export function libraryGroups() {
  const groups = []
  for (const entry of LIBRARY) {
    let group = groups.find((g) => g.id === entry.category)
    if (!group) {
      const cat = categoryById(entry.category)
      group = { id: entry.category, label: cat?.label || entry.category, icon: cat?.icon || '✨', entries: [] }
      groups.push(group)
    }
    group.entries.push(entry)
  }
  return groups
}

const norm = (title) => title.trim().toLowerCase()

export function hasTask(tasks, title) {
  return tasks.some((t) => norm(t.title) === norm(title) && !t.doneAt)
}

/**
 * Turn library entries into tasks. Chores that come around every couple of
 * weeks or less often get their first date spread over the coming weeks, so
 * adding many at once doesn't make them all due on day one. Weekly and daily
 * chores are spread by the scheduler already.
 */
export function tasksFromLibrary(entries, today) {
  return entries.map((entry, i) => {
    const interval = intervalDays(entry)
    const spread = interval >= 14 ? Math.min(interval, 28) : 0
    // Golden-ratio steps give an even, repeatable spread without randomness.
    const offset = spread ? Math.floor(((i * 0.618034) % 1) * spread) : 0
    return makeTask({
      title: entry.title,
      type: entry.type === 'want' ? 'want' : 'need',
      minutes: entry.estimatedMinutes,
      category: entry.category,
      startDate: addDays(today, offset),
      createdAt: Date.now() + i,
      ...repeatFor(entry.frequency),
    })
  })
}
