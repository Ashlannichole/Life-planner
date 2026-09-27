import { describe, expect, it } from 'vitest'
import { addDays } from './dates.js'
import { KEEP_DAYS, compactHistory } from './history.js'
import { totals } from './milestones.js'
import { initialState, makeTask } from './model.js'
import { rangeRecap } from './recap.js'
import { buildOccurrences } from './scheduler.js'

const TODAY = '2026-12-31'

function yearOfCheckoffs() {
  const water = makeTask({ id: 'water', title: 'Water plants', repeat: 'everyX', everyDays: 3, startDate: '2026-01-01' })
  const completions = []
  for (let i = 0; i < 365; i++) {
    const date = addDays('2026-01-01', i)
    // Shaped like real check-offs, which carry a few more fields than the summaries need.
    const at = Date.parse(date)
    if (i % 3 === 0) completions.push({ id: `w${i}x7k2`, occKey: `water:${i / 3}`, taskId: 'water', date, at, type: 'need', minutes: 5, category: 'admin', title: 'Water plants', eventId: null })
    if (i % 7 === 0) completions.push({ id: `r${i}x9q4`, occKey: 'read', taskId: 'read', date, at, type: 'want', minutes: 30, category: 'hobby', title: 'Read', eventId: null })
  }
  return { ...initialState(), onboarded: true, tasks: [water], completions }
}

describe('compacting old check-offs', () => {
  const before = yearOfCheckoffs()
  const after = compactHistory(before, TODAY)

  it('keeps only recent check-offs in full', () => {
    const cutoff = addDays(TODAY, -KEEP_DAYS)
    expect(after.completions.every((c) => c.date >= cutoff)).toBe(true)
    expect(after.completions.length).toBeLessThan(before.completions.length / 3)
    expect(JSON.stringify(after).length).toBeLessThan(JSON.stringify(before).length / 2)
  })

  it('keeps milestone totals exactly the same', () => {
    expect(totals(after)).toEqual(totals(before))
  })

  it('keeps recaps of old stretches the same (plant memories)', () => {
    const a = rangeRecap(before, '2026-03-01', '2026-04-15')
    const b = rangeRecap(after, '2026-03-01', '2026-04-15')
    expect(b.total).toBe(a.total)
    expect(b.funCount).toBe(a.funCount)
    expect(b.minutes).toBe(a.minutes)
    expect(b.activeDays).toBe(a.activeDays)
    expect(b.topCategories).toEqual(a.topCategories)
    expect(b.fun).toEqual(['Read'])
  })

  it('keeps repeating tasks on the same schedule', () => {
    const occA = buildOccurrences(before, TODAY, addDays(TODAY, 13))
    const occB = buildOccurrences(after, TODAY, addDays(TODAY, 13))
    expect(occB.map((o) => [o.key, o.due])).toEqual(occA.map((o) => [o.key, o.due]))
  })

  it('does nothing when there is nothing old to fold in', () => {
    expect(compactHistory(after, TODAY)).toBe(after)
  })

  it('still works once everything has been compacted', () => {
    const later = compactHistory(before, addDays(TODAY, 400))
    expect(later.completions).toHaveLength(0)
    expect(totals(later)).toEqual(totals(before))
    const occ = buildOccurrences(later, addDays(TODAY, 400), addDays(TODAY, 402))
    expect(occ[0].key).toBe(`water:${before.completions.filter((c) => c.taskId === 'water').length}`)
  })
})
