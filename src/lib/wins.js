// Free: the wins jar. Every finished thing is a slip of paper in the jar, along with wins
// people add themselves ("got out of bed", "called mom"). Shake it on a hard day and one
// comes out, as a reminder of what you've already done.

import { uid } from './model.js'
import { totals } from './milestones.js'

export const SLIP_COLORS = ['#f4c542', '#ef8a9a', '#a99ad6', '#8fb8d8', '#a7c4a0', '#f08a5d', '#f6c1d0']

/** Every win that can come out of the jar, newest first: { id, date, text, own }. */
export function winSlips(state) {
  const done = (state.completions || []).filter((c) => c.title).map((c) => ({ id: c.id, date: c.date, text: c.title, own: false }))
  // Older check-offs are compacted; their fun things still have names.
  const older = Object.entries(state.history?.days || {}).flatMap(([date, d]) =>
    (d.t || []).map((text, i) => ({ id: `h-${date}-${i}`, date, text, own: false })),
  )
  const own = (state.wins || []).map((w) => ({ ...w, own: true }))
  return [...own, ...done, ...older].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/** How many slips are in the jar, counting older check-offs that no longer have names. */
export function jarCount(state) {
  return totals(state).tasks + (state.wins || []).length
}

/** Pull a random win, not the same one twice in a row. `rand` is injectable for tests. */
export function pullWin(slips, rand = Math.random, lastId = null) {
  const pool = slips.length > 1 ? slips.filter((s) => s.id !== lastId) : slips
  if (!pool.length) return null
  return pool[Math.floor(rand() * pool.length)]
}

export function makeWin(text, date) {
  return { id: uid(), date, text: text.trim() }
}
