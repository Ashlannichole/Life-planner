import { addDays, startOfWeek } from './dates.js'
import { categoryById } from './model.js'

/** Everything that went right this week. Never what didn't happen. */
export function weeklyRecap(state, today) {
  const start = startOfWeek(today)
  const end = addDays(start, 6)
  const inWeek = (d) => d >= start && d <= end
  const done = state.completions.filter((c) => inWeek(c.date))
  const fun = done.filter((c) => c.type === 'want')

  const counts = {}
  for (const c of done) if (c.category) counts[c.category] = (counts[c.category] || 0) + 1
  const topCategories = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({ ...categoryById(id), count }))

  const activeDays = new Set(done.map((c) => c.date)).size

  return {
    start,
    end,
    total: done.length,
    minutes: done.reduce((t, c) => t + (c.minutes || 0), 0),
    fun: [...new Set(fun.map((c) => c.title))],
    funCount: fun.length,
    topCategories,
    activeDays,
    bloomed: state.plant.garden.filter((p) => inWeek(p.completedAt)),
    unlocks: state.plant.unlockLog.filter((u) => inWeek(u.date)),
  }
}
