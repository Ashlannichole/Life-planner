import { describe, expect, it } from 'vitest'
import { mergeState } from './merge.js'
import { initialState } from './model.js'
import { plusActive } from './plus.js'

const now = new Date('2026-10-12T12:00:00Z').getTime()

describe('Plus status', () => {
  it('is active only while bought and not expired', () => {
    expect(plusActive({ plus: null }, now)).toBe(false)
    expect(plusActive({ plus: { active: true, expires: '2026-11-12T12:00:00Z' } }, now)).toBe(true)
    expect(plusActive({ plus: { active: true, expires: '2026-10-01T12:00:00Z' } }, now)).toBe(false)
    expect(plusActive({ plus: { active: true, expires: null } }, now)).toBe(true)
    expect(plusActive({ plus: { active: false, expires: '2027-01-01T00:00:00Z' } }, now)).toBe(false)
  })

  it('syncs whichever device heard from the App Store last', () => {
    const base = initialState()
    const bought = { active: true, expires: '2026-11-12T12:00:00Z', checkedAt: 2 }
    const stale = { active: false, expires: null, checkedAt: 1 }
    expect(mergeState(base, { ...base, plus: stale }, { ...base, plus: bought }).plus).toEqual(bought)
    expect(mergeState(base, { ...base, plus: bought }, { ...base, plus: stale }).plus).toEqual(bought)
    expect(mergeState(base, { ...base, plus: null }, { ...base, plus: bought }).plus).toEqual(bought)
  })
})
