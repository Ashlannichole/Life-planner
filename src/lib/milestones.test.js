import { describe, expect, it } from 'vitest'
import { MILESTONES, applyMilestones, newMilestones, upcoming } from './milestones.js'
import { initialState } from './model.js'
import { PLANT_TYPES, POTS } from './plant.js'
import { rangeRecap } from './recap.js'

const done = (n, fields = {}) =>
  Array.from({ length: n }, (_, i) => ({ id: `c${i}`, taskId: 't', date: `2026-10-${String((i % 28) + 1).padStart(2, '0')}`, type: 'need', minutes: 15, title: `Task ${i}`, ...fields }))

describe('milestones', () => {
  it('rewards totals and records each only once', () => {
    const state = { ...initialState(), completions: done(10) }
    expect(newMilestones(state).map((m) => m.id)).toEqual(['first', 'tasks-10', 'days-7'])
    const { state: next, reached } = applyMilestones(state, '2026-10-10')
    expect(reached).toHaveLength(3)
    expect(next.unlockedThemes).toContain('lavender')
    expect(next.unlockedThemes).toContain('ocean')
    expect(next.plant.unlockedPots).toContain('sage')
    expect(applyMilestones(next, '2026-10-11').reached).toHaveLength(0)
  })

  it('points at the closest next milestone', () => {
    const state = { ...initialState(), completions: done(8) }
    const next = upcoming({ ...state, milestones: { first: 'x' } })
    expect(next[0].id).toBe('plants-1') // one bloom away
    expect(next.find((m) => m.id === 'tasks-10').current).toBe(8)
  })

  it('only rewards things that exist', () => {
    for (const m of MILESTONES) {
      const { kind, id } = m.reward
      if (kind === 'plant') expect(PLANT_TYPES.some((p) => p.id === id)).toBe(true)
      if (kind === 'pot') expect(POTS.some((p) => p.id === id)).toBe(true)
    }
  })
})

describe('plant memory', () => {
  it('summarizes what happened while a plant grew', () => {
    const state = { ...initialState(), completions: [...done(3), ...done(2, { type: 'want', title: 'Bake bread' })] }
    const r = rangeRecap(state, '2026-10-01', '2026-10-02')
    expect(r.total).toBe(4)
    expect(r.fun).toEqual(['Bake bread'])
  })
})
