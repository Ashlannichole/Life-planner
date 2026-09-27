// Cloud sync: one row per user holding the planner state as JSON, with a
// version number for safe concurrent writes. Devices always keep a local copy
// and sync in the background; conflicting edits are merged three ways against
// the last state this device synced (`meta.base`).

import { mergeState, syncable } from './merge.js'

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const TABLE = 'planner_state'

/** Thin wrapper over the Supabase table so the sync logic can be tested with a fake. */
export function supabaseRemote(client) {
  return {
    async get(userId) {
      const { data, error } = await client.from(TABLE).select('data, version').eq('user_id', userId).maybeSingle()
      if (error) throw error
      return data
    },
    async insert(userId, state) {
      const { error } = await client.from(TABLE).insert({ user_id: userId, data: state, version: 1 })
      if (error) {
        if (error.code === '23505') return null // another device created the row first
        throw error
      }
      return 1
    },
    /** Write only if nobody else wrote since `version`. Returns the new version, or null on conflict. */
    async update(userId, state, version) {
      const { data, error } = await client
        .from(TABLE)
        .update({ data: state, version: version + 1, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('version', version)
        .select('version')
      if (error) throw error
      return data?.length ? data[0].version : null
    },
  }
}

/**
 * One sync round. Returns `{ state, meta }` where `state` is a new local
 * state to apply (or null when nothing changed locally) and `meta` is what
 * to remember for next time.
 */
export async function syncOnce(remote, userId, localState, meta, attempt = 0) {
  if (attempt > 3) throw new Error('Sync kept conflicting; will try again later')
  const local = syncable(localState)
  const row = await remote.get(userId)

  if (!row) {
    // First device on this account: upload what's here.
    const version = await remote.insert(userId, local)
    if (version == null) return syncOnce(remote, userId, localState, meta, attempt + 1)
    return { state: null, meta: { userId, version, base: local } }
  }

  const known = meta?.userId === userId ? meta : null
  if (known && row.version === known.version) {
    // Nobody else changed anything: push local edits, if any.
    if (same(local, known.base)) return { state: null, meta: known }
    const version = await remote.update(userId, local, row.version)
    if (version == null) return syncOnce(remote, userId, localState, meta, attempt + 1)
    return { state: null, meta: { userId, version, base: local } }
  }

  // Another device saved since we last synced (or this device is new to the account).
  // A device that was never set up just takes the account as it is.
  const merged = localState.onboarded ? mergeState(known?.base, local, row.data) : row.data
  let version = row.version
  if (!same(merged, row.data)) {
    version = await remote.update(userId, merged, row.version)
    if (version == null) return syncOnce(remote, userId, localState, meta, attempt + 1)
  }
  return { state: merged, meta: { userId, version, base: merged } }
}

const META_KEY = 'sprout-planner:sync'

export function loadSyncMeta() {
  try {
    return JSON.parse(localStorage.getItem(META_KEY)) || null
  } catch {
    return null
  }
}

export function saveSyncMeta(meta) {
  try {
    if (meta) localStorage.setItem(META_KEY, JSON.stringify(meta))
    else localStorage.removeItem(META_KEY)
  } catch {
    // Storage unavailable; sync will simply merge from scratch next time.
  }
}
