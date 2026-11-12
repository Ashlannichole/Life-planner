import { describe, expect, it } from 'vitest'
import { initialState } from './model.js'
import { BLOOM_AT, PLANT_TYPES, POTS, applySeasonalFinds, pickReward, seasonalFinds, seasonalProgress, stageFor, unwater, water } from './plant.js'

const never = () => 0.99

describe('plant', () => {
  it('grows through stages as it is watered', () => {
    expect(stageFor(0).id).toBe('seed')
    expect(stageFor(3).id).toBe('sprout')
    expect(stageFor(BLOOM_AT).id).toBe('bloom')
  })

  it('moves to the garden at full bloom and starts a new seed with a reward', () => {
    let plant = initialState().plant
    let last
    for (let i = 0; i < BLOOM_AT; i++) {
      last = water(plant, '2026-10-01', never)
      plant = last.plant
    }
    expect(last.events.bloomed).toBeTruthy()
    expect(plant.garden).toHaveLength(1)
    expect(plant.current.water).toBe(0)
    expect(last.events.reward).toBeTruthy()
    expect(plant.unlockLog).toHaveLength(1)
  })

  it('never goes below zero when undoing', () => {
    const plant = initialState().plant
    expect(unwater(plant).current.water).toBe(0)
  })

  it('stops offering rewards once everything is unlocked', () => {
    const plant = initialState().plant
    expect(pickReward(plant, () => 0, { guaranteed: true })).toBeTruthy()
    const complete = {
      ...plant,
      unlockedPots: POTS.map((p) => p.id),
      unlockedPlants: PLANT_TYPES.filter((p) => !p.milestone).map((p) => p.id),
    }
    expect(pickReward(complete, () => 0, { guaranteed: true })).toBeNull()
  })
})

describe('seasonal finds', () => {
  const doneIn = (month, n) =>
    Array.from({ length: n }, (_, i) => ({ id: `c${i}`, date: `2026-${month}-${String((i % 28) + 1).padStart(2, '0')}`, title: 'x' }))

  it('October hides poisonous plants and a cauldron pot', () => {
    expect(seasonalFinds(10).map((f) => [f.id, f.at])).toEqual([
      ['nightshade', 8],
      ['bat-flower', 20],
      ['cauldron', 30],
    ])
  })

  it('December has holly, a Christmas tree and a candy cane pot', () => {
    expect(seasonalFinds(12).map((f) => f.id)).toEqual(['holly', 'xmas-tree', 'candy-cane'])
  })

  it('every month has at least one', () => {
    for (let m = 1; m <= 12; m++) expect(seasonalFinds(m).length).toBeGreaterThan(0)
  })

  it('counts only this month and unlocks at the set counts', () => {
    const state = { ...initialState(), completions: [...doneIn('09', 30), ...doneIn('10', 8)] }
    const { plant, found } = applySeasonalFinds(state, '2026-10-12')
    expect(found.map((f) => f.id)).toEqual(['nightshade'])
    expect(plant.unlockedPlants).toContain('nightshade')
    // Already found: nothing new.
    expect(applySeasonalFinds({ ...state, plant }, '2026-10-12').found).toEqual([])
    expect(seasonalProgress({ ...state, plant }, '2026-10-12').next.id).toBe('bat-flower')
  })

  it('never hands out seasonal things as random surprises', () => {
    const plant = initialState().plant
    for (let i = 0; i < 50; i++) {
      const r = pickReward(plant, () => i / 50, { guaranteed: true })
      if (r) expect(['nightshade', 'holly', 'cauldron', 'candy-cane', 'xmas-tree']).not.toContain(r.id)
    }
  })
})
