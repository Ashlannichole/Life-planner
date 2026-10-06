// Three-way merge of the whole planner state, used by sync.
//
// `base` is the last state both sides agreed on, `local` is this device and
// `remote` is what another device saved since. Each side's changes relative to
// the base are kept; when both changed the same record, this device wins.
// Deletions are detected by comparing with the base, so no tombstones are needed.

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/** Merge two lists of records that each have an `id`. */
export function mergeById(base = [], local = [], remote = []) {
  const b = new Map(base.map((x) => [x.id, x]))
  const r = new Map(remote.map((x) => [x.id, x]))
  const l = new Map(local.map((x) => [x.id, x]))
  const out = []
  const pick = (id) => {
    const inB = b.has(id)
    const inL = l.has(id)
    const inR = r.has(id)
    if (inL && inR) {
      const localChanged = !same(l.get(id), b.get(id))
      const remoteChanged = !same(r.get(id), b.get(id))
      return localChanged || !remoteChanged ? l.get(id) : r.get(id)
    }
    // Deleted on one side: stays deleted unless the other side edited it meanwhile.
    if (inL) return inB && same(l.get(id), b.get(id)) ? null : l.get(id)
    if (inR) return inB && same(r.get(id), b.get(id)) ? null : r.get(id)
    return null
  }
  for (const id of l.keys()) {
    const v = pick(id)
    if (v) out.push(v)
  }
  for (const id of r.keys()) {
    if (l.has(id)) continue
    const v = pick(id)
    if (v) out.push(v)
  }
  return out
}

/** Merge plain key → value objects the same way. */
export function mergeMap(base = {}, local = {}, remote = {}) {
  const out = {}
  const keys = new Set([...Object.keys(local), ...Object.keys(remote)])
  for (const k of keys) {
    const inB = k in base
    const inL = k in local
    const inR = k in remote
    if (inL && inR) {
      const localChanged = !same(local[k], base[k])
      const remoteChanged = !same(remote[k], base[k])
      out[k] = localChanged || !remoteChanged ? local[k] : remote[k]
    } else if (inL) {
      if (!(inB && same(local[k], base[k]))) out[k] = local[k]
    } else if (inR) {
      if (!(inB && same(remote[k], base[k]))) out[k] = remote[k]
    }
  }
  return out
}

/** A single value: whichever side changed it (this device if both did). */
export function mergeValue(base, local, remote) {
  if (!same(local, base)) return local
  return remote
}

const union = (...lists) => [...new Set(lists.flat().filter(Boolean))]

function unionBy(key, ...lists) {
  const seen = new Map()
  for (const item of lists.flat()) if (item) seen.set(key(item), item)
  return [...seen.values()]
}

function mergePlant(base, local, remote) {
  const b = base?.current || {}
  const l = local.current
  const r = remote.current
  let current
  if (l.startedAt === r.startedAt) {
    // Same plant on both devices: add up the watering each side did.
    const bWater = b.startedAt === l.startedAt ? b.water || 0 : 0
    current = {
      ...mergeMap(b, l, r),
      water: Math.max(0, bWater + (l.water - bWater) + (r.water - bWater)),
    }
  } else {
    // One side grew a plant to bloom and started a new one: the newer plant wins.
    current = l.startedAt > r.startedAt ? l : r
  }
  const bTotal = base?.totalWater || 0
  return {
    ...local,
    current,
    garden: mergeById(base?.garden, local.garden, remote.garden),
    unlockedPlants: union(local.unlockedPlants, remote.unlockedPlants),
    unlockedPots: union(local.unlockedPots, remote.unlockedPots),
    unlockLog: unionBy((u) => `${u.kind}:${u.id}`, remote.unlockLog, local.unlockLog),
    totalWater: Math.max(0, bTotal + (local.totalWater - bTotal) + (remote.totalWater - bTotal)),
  }
}

const ID_LISTS = ['tasks', 'completions', 'events', 'recipes', 'templates', 'prepTemplates', 'packingLists', 'specialDays']
const MAPS = ['pins', 'deferrals', 'dayOrder', 'mealPlan', 'energy', 'milestones', 'settings', 'holidayPlans']

/** Fields kept per device and never synced. */
export const LOCAL_ONLY = ['planSnapshot', 'workouts']

export function syncable(state) {
  const out = { ...state }
  for (const k of LOCAL_ONLY) delete out[k]
  return out
}

export function mergeState(base, local, remote) {
  base = base || {}
  const out = { ...remote, ...local }
  for (const k of ID_LISTS) out[k] = mergeById(base[k], local[k], remote[k])
  for (const k of MAPS) out[k] = mergeMap(base[k], local[k], remote[k])
  out.groceries = {
    checks: mergeMap(base.groceries?.checks, local.groceries?.checks, remote.groceries?.checks),
    extras: mergeById(base.groceries?.extras, local.groceries?.extras, remote.groceries?.extras),
  }
  out.history = {
    days: mergeMap(base.history?.days, local.history?.days, remote.history?.days),
    tasks: mergeMap(base.history?.tasks, local.history?.tasks, remote.history?.tasks),
  }
  out.plant = mergePlant(base.plant, local.plant, remote.plant)
  out.unlockedThemes = union(local.unlockedThemes, remote.unlockedThemes)
  out.onboarded = !!(local.onboarded || remote.onboarded)
  out.activeTemplateId = mergeValue(base.activeTemplateId, local.activeTemplateId, remote.activeTemplateId)
  // Never point at a schedule that no longer exists.
  if (!out.templates.some((t) => t.id === out.activeTemplateId)) out.activeTemplateId = out.templates[0]?.id
  return out
}
