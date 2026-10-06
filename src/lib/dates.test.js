import { describe, expect, it } from 'vitest'
import { endAfterStart, formatMonth, monthGrid, startOfMonth } from './dates.js'

describe('month calendar helpers', () => {
  it('finds the first of the month', () => {
    expect(startOfMonth('2026-10-17')).toBe('2026-10-01')
  })

  it('lays a month out in whole Monday-to-Sunday weeks', () => {
    // October 2026 starts on a Thursday and ends on a Saturday.
    const weeks = monthGrid('2026-10-17')
    expect(weeks).toHaveLength(5)
    for (const w of weeks) expect(w).toHaveLength(7)
    expect(weeks[0][0]).toBe('2026-09-28') // the Monday before the 1st
    expect(weeks[0][3]).toBe('2026-10-01')
    expect(weeks.at(-1).at(-1)).toBe('2026-11-01') // through the Sunday after the 31st
  })

  it('handles a month that needs six rows', () => {
    // August 2026 starts on a Saturday and has 31 days.
    expect(monthGrid('2026-08-01')).toHaveLength(6)
  })

  it('names the month', () => {
    expect(formatMonth('2026-10-17')).toBe('October 2026')
  })
})

describe('endAfterStart', () => {
  it('starts a new multi-day event with the day after', () => {
    expect(endAfterStart('2026-10-20', '2026-10-20', null)).toBe('2026-10-21')
  })

  it('keeps the trip the same length when the start moves', () => {
    // A 4-day trip (Oct 20–24) moved to start Nov 3 ends Nov 7.
    expect(endAfterStart('2026-11-03', '2026-10-20', '2026-10-24')).toBe('2026-11-07')
  })

  it('fixes an end that is not after the start', () => {
    expect(endAfterStart('2026-10-20', '2026-10-20', '2026-10-20')).toBe('2026-10-21')
  })
})
