import { addDays, startOfWeek } from './dates.js'
import { daySummaries } from './history.js'
import { categoryById } from './model.js'

/** Everything that went right this week. Never what didn't happen. */
export function weeklyRecap(state, today) {
  const start = startOfWeek(today)
  return rangeRecap(state, start, addDays(start, 6))
}

/** Everything done between two days (inclusive), e.g. the life of one plant. */
export function rangeRecap(state, start, end) {
  const inRange = (d) => d >= start && d <= end
  // Per-day summaries cover both recent check-offs and compacted older ones.
  const days = Object.values(daySummaries(state, start, end))

  const counts = {}
  for (const d of days) for (const [cat, n] of Object.entries(d.cats)) counts[cat] = (counts[cat] || 0) + n
  const topCategories = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({ ...categoryById(id), count }))

  const sum = (key) => days.reduce((t, d) => t + d[key], 0)

  return {
    start,
    end,
    total: sum('n'),
    minutes: sum('min'),
    fun: [...new Set(days.flatMap((d) => d.funTitles))],
    funCount: sum('fun'),
    topCategories,
    activeDays: days.filter((d) => d.n > 0).length,
    bloomed: state.plant.garden.filter((p) => inRange(p.completedAt)),
    unlocks: state.plant.unlockLog.filter((u) => inRange(u.date)),
  }
}
