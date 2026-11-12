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
  { id: 'rose', name: 'Rose', petal: '#d9546e', center: '#a83a52', leaf: '#6f9c6a', petals: 6, shape: 'round', milestone: true },
  { id: 'cherry', name: 'Cherry blossom', petal: '#f6c1d0', center: '#e58aa6', leaf: '#8aab7d', petals: 5, shape: 'round', milestone: true },
  { id: 'moonflower', name: 'Moonflower', petal: '#e8ecff', center: '#c9d3ff', leaf: '#6f9c8a', petals: 5, shape: 'round', rare: true },
  { id: 'glow-orchid', name: 'Glow orchid', petal: '#d59bf0', center: '#fff2a8', leaf: '#6fa38a', petals: 5, shape: 'cup', rare: true },
  // Plus: seasonal plants, found only in their month (see SEASONAL_FINDS below).
  { id: 'snowdrop', name: 'Snowdrop', petal: '#f7f9fb', center: '#9cc8a4', leaf: '#7fae8a', shape: 'bell', season: 1 },
  { id: 'bleeding-heart', name: 'Bleeding heart', petal: '#e86a92', center: '#fbeef2', leaf: '#86b37a', shape: 'heart', season: 2 },
  { id: 'shamrock', name: 'Shamrock', petal: '#5fae5a', center: '#3f8a3e', leaf: '#5fae5a', shape: 'clover', season: 3 },
  { id: 'easter-lily', name: 'Easter lily', petal: '#fffdf6', center: '#ece3c4', leaf: '#7fae6b', petals: 3, shape: 'cup', season: 4 },
  { id: 'peony', name: 'Peony', petal: '#f4a6bf', center: '#f7c9d7', leaf: '#7fae6b', petals: 9, shape: 'round', season: 5 },
  { id: 'marigold', name: 'Marigold', petal: '#f5a524', center: '#c2571a', leaf: '#6f9c5a', petals: 16, shape: 'long', season: 6 },
  { id: 'firework-allium', name: 'Firework allium', petal: '#e04848', center: '#3a6fd8', leaf: '#7fae6b', shape: 'burst', season: 7 },
  { id: 'hibiscus', name: 'Hibiscus', petal: '#f2715a', center: '#f7d046', leaf: '#5f9c5a', petals: 5, shape: 'round', season: 8 },
  { id: 'apple-blossom', name: 'Apple blossom', petal: '#fbe3e8', center: '#e86a7a', leaf: '#86b37a', petals: 5, shape: 'round', season: 9 },
  {
    id: 'nightshade',
    name: 'Deadly nightshade',
    petal: '#7a4fa3',
    center: '#4a2f66',
    berries: '#1e1a24',
    leaf: '#5f7f5a',
    shape: 'bell',
    season: 10,
    note: 'Poisonous! Look, don’t taste 🖤',
  },
  { id: 'bat-flower', name: 'Black bat flower', petal: '#2d2433', center: '#5b3f6b', leaf: '#5f7f5a', shape: 'bat', season: 10, note: 'It even has whiskers 🦇' },
  { id: 'mum', name: 'Chrysanthemum', petal: '#d9822b', center: '#9c4f1c', leaf: '#7a8f5a', petals: 18, shape: 'long', season: 11 },
  { id: 'holly', name: 'Holly', petal: '#2f7a4d', center: '#d62f3a', leaf: '#3f8f5c', shape: 'holly', season: 12 },
  { id: 'xmas-tree', name: 'Christmas tree', petal: '#2f7a4d', center: '#f4c430', leaf: '#2f7a4d', shape: 'tree', season: 12, note: 'Decorated, of course 🎄' },
]

export const POTS = [
  { id: 'terracotta', name: 'Terracotta', color: '#d98a64', rim: '#c47651' },
  { id: 'sky', name: 'Sky', color: '#8fb8d8', rim: '#7aa3c4' },
  { id: 'sage', name: 'Sage', color: '#a7c4a0', rim: '#91b08a' },
  { id: 'speckled', name: 'Speckled', color: '#efe6d8', rim: '#ddd2c1', speckled: true },
  { id: 'blush', name: 'Blush', color: '#efb8b8', rim: '#dfa3a3' },
  { id: 'midnight', name: 'Midnight', color: '#4a5580', rim: '#3c466d' },
  { id: 'gold', name: 'Gold', color: '#e7c66b', rim: '#d1ae52', rare: true },
  { id: 'cauldron', name: 'Cauldron', color: '#2f2a35', rim: '#3b3442', slime: '#7ed957', season: 10 },
  { id: 'candy-cane', name: 'Candy cane', color: '#fbf7f2', rim: '#e63946', stripes: '#e63946', season: 12 },
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
  // Milestone and seasonal plants are earned, never random.
  const lockedPots = POTS.filter((p) => !p.season && !plant.unlockedPots.includes(p.id))
  const lockedPlants = PLANT_TYPES.filter((p) => !p.milestone && !p.season && !plant.unlockedPlants.includes(p.id))
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

// ---- Seasonal finds (Plus)
// Each month has its own rare plants, on theme with the calendar: poisonous ones in
// October, holly and a little Christmas tree in December. Finishing things during the
// month finds them, at set counts so there's always a "6 more to go". Once found they're
// yours forever; a missed one comes back next year.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const monthName = (month) => MONTHS[month - 1]

const FIRST_FIND = 8
const SECOND_FIND = 20
const POT_FIND = 30

/** What can be found in a month (1–12), in the order they're found. */
export function seasonalFinds(month) {
  const plants = PLANT_TYPES.filter((p) => p.season === month)
  const pots = POTS.filter((p) => p.season === month)
  return [
    ...plants.map((p, i) => ({ kind: 'plant', id: p.id, name: p.name, at: plants.length === 1 ? 10 : i === 0 ? FIRST_FIND : SECOND_FIND })),
    ...pots.map((p) => ({ kind: 'pot', id: p.id, name: p.name, at: POT_FIND })),
  ]
}

/** This month's finds for a day key, with how far along they are. */
export function seasonalProgress(state, day) {
  const month = Number(day.slice(5, 7))
  const prefix = day.slice(0, 7)
  const done = (state.completions || []).filter((c) => c.date.startsWith(prefix)).length
  const plant = state.plant
  const finds = seasonalFinds(month).map((f) => ({
    ...f,
    found: f.kind === 'plant' ? plant.unlockedPlants.includes(f.id) : plant.unlockedPots.includes(f.id),
  }))
  return { month, monthName: monthName(month), done, finds, next: finds.find((f) => !f.found) || null }
}

/** Unlock any of this month's finds that have been reached. Returns the plant and what was found. */
export function applySeasonalFinds(state, day) {
  const { done, finds } = seasonalProgress(state, day)
  const reached = finds.filter((f) => !f.found && done >= f.at)
  let plant = state.plant
  for (const f of reached) plant = applyReward(plant, { kind: f.kind, id: f.id, name: f.name, rare: true, seasonal: true }, day)
  return { plant, found: reached.map((f) => ({ kind: f.kind, id: f.id, name: f.name, rare: true, seasonal: true })) }
}
