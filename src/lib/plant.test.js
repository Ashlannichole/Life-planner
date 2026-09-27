import { describe, expect, it } from 'vitest'
import { initialState } from './model.js'
import { BLOOM_AT, PLANT_TYPES, POTS, pickReward, stageFor, unwater, water } from './plant.js'

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
      unlockedPlants: PLANT_TYPES.map((p) => p.id),
    }
    expect(pickReward(complete, () => 0, { guaranteed: true })).toBeNull()
  })
})
