// The plant grows with every completed task and never wilts or dies.
// Inactive days simply pause growth.

export const STAGES = [
  { id: 'seed', label: 'Seed', at: 0 },
  { id: 'sprout', label: 'Sprout', at: 3 },
  { id: 'seedling', label: 'Seedling', at: 8 },
  { id: 'young', label: 'Growing', at: 15 },
  { id: 'bud', label: 'Budding', at: 24 },
  { id: 'bloom', label: 'Full bloom', at: 35 },
]
export const BLOOM_AT = STAGES[STAGES.length - 1].at

export const PLANT_TYPES = [
  { id: 'sunflower', name: 'Sunflower', petal: '#f4c542', center: '#8a5a2b', leaf: '#7fae6b', petals: 12, shape: 'long' },
  { id: 'tulip', name: 'Tulip', petal: '#ef8a9a', center: '#d8697c', leaf: '#86b37a', petals: 3, shape: 'cup' },
  { id: 'lavender', name: 'Lavender', petal: '#a99ad6', center: '#8b7cc4', leaf: '#8fae8a', petals: 0, shape: 'spike' },
  { id: 'daisy', name: 'Daisy', petal: '#fbfaf5', center: '#f2c14e', leaf: '#7fae6b', petals: 14, shape: 'long' },
  { id: 'poppy', name: 'Poppy', petal: '#f08a5d', center: '#3d3a4b', leaf: '#86a86f', petals: 5, shape: 'round' },
  { id: 'cornflower', name: 'Cornflower', petal: '#6c9bd2', center: '#3f5f8f', leaf: '#8aab7d', petals: 8, shape: 'round' },
  { id: 'moonflower', name: 'Moonflower', petal: '#e8ecff', center: '#c9d3ff', leaf: '#6f9c8a', petals: 5, shape: 'round', rare: true },
  { id: 'glow-orchid', name: 'Glow orchid', petal: '#d59bf0', center: '#fff2a8', leaf: '#6fa38a', petals: 5, shape: 'cup', rare: true },
]

export const POTS = [
  { id: 'terracotta', name: 'Terracotta', color: '#d98a64', rim: '#c47651' },
  { id: 'sky', name: 'Sky', color: '#8fb8d8', rim: '#7aa3c4' },
  { id: 'sage', name: 'Sage', color: '#a7c4a0', rim: '#91b08a' },
  { id: 'speckled', name: 'Speckled', color: '#efe6d8', rim: '#ddd2c1', speckled: true },
  { id: 'blush', name: 'Blush', color: '#efb8b8', rim: '#dfa3a3' },
  { id: 'midnight', name: 'Midnight', color: '#4a5580', rim: '#3c466d' },
  { id: 'gold', name: 'Gold', color: '#e7c66b', rim: '#d1ae52', rare: true },
]

export const plantType = (id) => PLANT_TYPES.find((p) => p.id === id) || PLANT_TYPES[0]
export const potType = (id) => POTS.find((p) => p.id === id) || POTS[0]

export function stageFor(water) {
  let stage = STAGES[0]
  for (const s of STAGES) if (water >= s.at) stage = s
  return stage
}

export function stageIndex(water) {
  return STAGES.indexOf(stageFor(water))
}

/** 0…1 progress toward the next stage (1 when in full bloom). */
export function stageProgress(water) {
  const i = stageIndex(water)
  if (i === STAGES.length - 1) return 1
  const from = STAGES[i].at
  const to = STAGES[i + 1].at
  return (water - from) / (to - from)
}

/**
 * Pick a surprise reward, if any is left to unlock.
 * `rand` is injectable so tests stay deterministic.
 */
export function pickReward(plant, rand = Math.random, { guaranteed = false } = {}) {
  if (!guaranteed && rand() > 0.08) return null
  const lockedPots = POTS.filter((p) => !plant.unlockedPots.includes(p.id))
  const lockedPlants = PLANT_TYPES.filter((p) => !plant.unlockedPlants.includes(p.id))
  const options = [
    ...lockedPots.map((p) => ({ kind: 'pot', id: p.id, name: p.name, rare: !!p.rare })),
    ...lockedPlants.map((p) => ({ kind: 'plant', id: p.id, name: p.name, rare: !!p.rare })),
  ]
  if (!options.length) return null
  // Rare things are less likely, not impossible.
  const weighted = options.flatMap((o) => (o.rare ? [o] : [o, o, o]))
  return weighted[Math.floor(rand() * weighted.length)]
}

export function applyReward(plant, reward, date) {
  if (!reward) return plant
  return {
    ...plant,
    unlockedPots: reward.kind === 'pot' ? [...plant.unlockedPots, reward.id] : plant.unlockedPots,
    unlockedPlants: reward.kind === 'plant' ? [...plant.unlockedPlants, reward.id] : plant.unlockedPlants,
    unlockLog: [...plant.unlockLog, { ...reward, date }],
  }
}

/**
 * Water the plant once. Returns the new plant state plus what happened, so the
 * UI can celebrate: a new stage, a bloom (plant moved to the garden), a reward.
 */
export function water(plant, date, rand = Math.random) {
  const before = plant.current.water
  const after = before + 1
  let next = { ...plant, current: { ...plant.current, water: after }, totalWater: plant.totalWater + 1 }
  const events = { stageUp: stageIndex(after) > stageIndex(before) ? stageFor(after) : null, bloomed: null, reward: null }

  if (after >= BLOOM_AT) {
    const grown = { ...next.current, completedAt: date, id: `${date}-${next.garden.length}` }
    events.bloomed = grown
    next = {
      ...next,
      garden: [...next.garden, grown],
      // A fresh seed of the same kind until the user picks another one.
      current: { typeId: grown.typeId, potId: grown.potId, water: 0, startedAt: date, needsPick: true },
    }
    events.reward = pickReward(next, rand, { guaranteed: true })
  } else {
    events.reward = pickReward(next, rand)
  }
  next = applyReward(next, events.reward, date)
  return { plant: next, events }
}

/** Undo one watering (used when a check-off is undone). Never un-blooms. */
export function unwater(plant) {
  if (plant.current.water <= 0) return plant
  return {
    ...plant,
    current: { ...plant.current, water: plant.current.water - 1 },
    totalWater: Math.max(0, plant.totalWater - 1),
  }
}
