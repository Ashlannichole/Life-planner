// Milestones are based on totals, which only ever go up, never on consistency.
// Each unlocks something small: a theme color, or a plant or pot.

export const THEMES = [
  { id: 'sage', name: 'Sage', light: '#5d8c69', dark: '#86b892', softLight: '#e3eee4', softDark: '#2d3a2f' },
  { id: 'lavender', name: 'Lavender', light: '#8069b0', dark: '#b7a4e0', softLight: '#ece6f6', softDark: '#34304a' },
  { id: 'ocean', name: 'Ocean', light: '#3f7fa6', dark: '#86bbdc', softLight: '#e1eef6', softDark: '#27384a' },
  { id: 'sunset', name: 'Sunset', light: '#c0704a', dark: '#e8a27f', softLight: '#f8e7dd', softDark: '#45322a' },
  { id: 'rose', name: 'Rose', light: '#b35d7a', dark: '#e59bb4', softLight: '#f6e3ea', softDark: '#452c36' },
  { id: 'forest', name: 'Forest', light: '#3d6b4f', dark: '#7fb392', softLight: '#dde9e1', softDark: '#24352b' },
]

export const MILESTONES = [
  { id: 'first', stat: 'tasks', at: 1, title: 'Your first task', reward: { kind: 'pot', id: 'sage' } },
  { id: 'tasks-10', stat: 'tasks', at: 10, title: '10 things done', reward: { kind: 'theme', id: 'lavender' } },
  { id: 'fun-10', stat: 'fun', at: 10, title: '10 fun things', reward: { kind: 'plant', id: 'poppy' } },
  { id: 'tasks-25', stat: 'tasks', at: 25, title: '25 things done', reward: { kind: 'pot', id: 'speckled' } },
  { id: 'days-7', stat: 'days', at: 7, title: '7 days you showed up', reward: { kind: 'theme', id: 'ocean' } },
  { id: 'plants-1', stat: 'plants', at: 1, title: 'Your first full bloom', reward: { kind: 'plant', id: 'daisy' } },
  { id: 'tasks-50', stat: 'tasks', at: 50, title: '50 things done', reward: { kind: 'theme', id: 'sunset' } },
  { id: 'days-30', stat: 'days', at: 30, title: 'A month of showing up', reward: { kind: 'plant', id: 'rose' } },
  { id: 'tasks-100', stat: 'tasks', at: 100, title: '100 things done', reward: { kind: 'theme', id: 'rose' } },
  { id: 'fun-50', stat: 'fun', at: 50, title: '50 fun things', reward: { kind: 'pot', id: 'midnight' } },
  { id: 'plants-4', stat: 'plants', at: 4, title: 'A full garden row', reward: { kind: 'plant', id: 'cherry' } },
  { id: 'tasks-250', stat: 'tasks', at: 250, title: '250 things done', reward: { kind: 'theme', id: 'forest' } },
  { id: 'tasks-500', stat: 'tasks', at: 500, title: '500 things done', reward: { kind: 'pot', id: 'gold' } },
]

export const STAT_LABELS = { tasks: 'things done', fun: 'fun things', days: 'days you showed up', plants: 'plants grown' }

export function totals(state) {
  // Older check-offs are compacted into per-day summaries; count both.
  const past = Object.entries(state.history?.days || {})
  const days = new Set([...state.completions.map((c) => c.date), ...past.map(([date]) => date)])
  return {
    tasks: state.completions.length + past.reduce((t, [, d]) => t + (d.n || 0), 0),
    fun: state.completions.filter((c) => c.type === 'want').length + past.reduce((t, [, d]) => t + (d.f || 0), 0),
    days: days.size,
    plants: state.plant.garden.length,
  }
}

/** Milestones reached but not yet recorded. */
export function newMilestones(state) {
  const t = totals(state)
  const have = state.milestones || {}
  return MILESTONES.filter((m) => !have[m.id] && t[m.stat] >= m.at)
}

/** The next milestone for each stat, for a gentle "coming up" line. */
export function upcoming(state) {
  const t = totals(state)
  const have = state.milestones || {}
  const next = []
  for (const stat of Object.keys(STAT_LABELS)) {
    const m = MILESTONES.find((x) => x.stat === stat && !have[x.id] && t[stat] < x.at)
    if (m) next.push({ ...m, current: t[stat] })
  }
  return next.sort((a, b) => a.at - a.current - (b.at - b.current))
}

/** Record milestones and grant their rewards. Returns the new state and what was reached. */
export function applyMilestones(state, date) {
  const reached = newMilestones(state)
  if (!reached.length) return { state, reached }
  const milestones = { ...(state.milestones || {}) }
  const plant = { ...state.plant }
  let themes = state.unlockedThemes || ['sage']
  for (const m of reached) {
    milestones[m.id] = date
    const { kind, id } = m.reward
    if (kind === 'theme' && !themes.includes(id)) themes = [...themes, id]
    if (kind === 'pot' && !plant.unlockedPots.includes(id)) plant.unlockedPots = [...plant.unlockedPots, id]
    if (kind === 'plant' && !plant.unlockedPlants.includes(id)) plant.unlockedPlants = [...plant.unlockedPlants, id]
  }
  return { state: { ...state, milestones, plant, unlockedThemes: themes }, reached }
}
