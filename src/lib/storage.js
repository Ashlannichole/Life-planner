import { initialState } from './model.js'

const KEY = 'sprout-planner:v1'

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialState()
    return migrate(JSON.parse(raw))
  } catch {
    return initialState()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable (private mode). The app keeps working in memory.
  }
}

/** Fill in anything missing so older saves keep working as the model grows. */
export function migrate(saved) {
  const base = initialState()
  if (!saved || typeof saved !== 'object') return base
  return {
    ...base,
    ...saved,
    plant: { ...base.plant, ...(saved.plant || {}) },
    settings: { ...base.settings, ...(saved.settings || {}) },
    templates: saved.templates?.length ? saved.templates : base.templates,
    activeTemplateId: saved.templates?.length ? saved.activeTemplateId : base.activeTemplateId,
  }
}

/** Drop overrides that point at days already gone by. */
export function housekeep(state, today) {
  const pins = Object.fromEntries(Object.entries(state.pins || {}).filter(([, d]) => d >= today))
  const deferrals = Object.fromEntries(Object.entries(state.deferrals || {}).filter(([, d]) => d > today))
  const dayOrder = Object.fromEntries(Object.entries(state.dayOrder || {}).filter(([d]) => d >= today))
  const energy = Object.fromEntries(Object.entries(state.energy || {}).filter(([d]) => d >= today))
  return { ...state, pins, deferrals, dayOrder, energy }
}
