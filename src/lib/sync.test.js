import { describe, expect, it } from 'vitest'
import { initialState, makeTask } from './model.js'
import { syncOnce } from './sync.js'

/** In-memory stand-in for the planner_state table. */
function fakeRemote() {
  const rows = new Map()
  const calls = { get: 0, getVersion: 0 }
  return {
    rows,
    calls,
    async getVersion(userId) {
      calls.getVersion += 1
      return rows.get(userId)?.version ?? null
    },
    async get(userId) {
      calls.get += 1
      const row = rows.get(userId)
      return row ? structuredClone(row) : null
    },
    async insert(userId, data) {
      if (rows.has(userId)) return null
      rows.set(userId, { data: structuredClone(data), version: 1 })
      return 1
    },
    async update(userId, data, version) {
      const row = rows.get(userId)
      if (!row || row.version !== version) return null
      rows.set(userId, { data: structuredClone(data), version: version + 1 })
      return version + 1
    },
  }
}

const withTask = (state, id) => ({ ...state, tasks: [...state.tasks, makeTask({ id, title: id })] })

describe('syncOnce', () => {
  it('uploads this device’s data on first sign-in', async () => {
    const remote = fakeRemote()
    const phone = withTask({ ...initialState(), onboarded: true }, 'laundry')
    const { state, meta } = await syncOnce(remote, 'u1', phone, null)
    expect(state).toBeNull()
    expect(meta.version).toBe(1)
    expect(remote.rows.get('u1').data.tasks[0].id).toBe('laundry')
  })

  it('gives a brand-new device the account’s plan', async () => {
    const remote = fakeRemote()
    const phone = withTask({ ...initialState(), onboarded: true }, 'laundry')
    await syncOnce(remote, 'u1', phone, null)
    const { state } = await syncOnce(remote, 'u1', initialState(), null)
    expect(state.onboarded).toBe(true)
    expect(state.tasks.map((t) => t.id)).toEqual(['laundry'])
  })

  it('merges edits made on two devices', async () => {
    const remote = fakeRemote()
    const start = withTask({ ...initialState(), onboarded: true }, 'laundry')
    const phoneFirst = await syncOnce(remote, 'u1', start, null)
    const ipadFirst = await syncOnce(remote, 'u1', initialState(), null)

    // The iPad adds a task and syncs.
    const ipad = withTask(ipadFirst.state, 'vacuum')
    await syncOnce(remote, 'u1', ipad, ipadFirst.meta)

    // Meanwhile the phone adds a different one, then syncs.
    const phone = withTask(start, 'dishes')
    const { state, meta } = await syncOnce(remote, 'u1', phone, phoneFirst.meta)
    expect(state.tasks.map((t) => t.id).sort()).toEqual(['dishes', 'laundry', 'vacuum'])
    expect(remote.rows.get('u1').data.tasks).toHaveLength(3)
    expect(meta.version).toBe(remote.rows.get('u1').version)
  })

  it('does nothing when nothing changed, without downloading the plan', async () => {
    const remote = fakeRemote()
    const phone = { ...initialState(), onboarded: true }
    const first = await syncOnce(remote, 'u1', phone, null)
    const downloads = remote.calls.get
    const again = await syncOnce(remote, 'u1', phone, first.meta)
    expect(again.state).toBeNull()
    expect(remote.rows.get('u1').version).toBe(1)
    expect(remote.calls.get).toBe(downloads)
  })

  it('uploads local edits without downloading the plan first', async () => {
    const remote = fakeRemote()
    const phone = { ...initialState(), onboarded: true }
    const first = await syncOnce(remote, 'u1', phone, null)
    const downloads = remote.calls.get
    const { meta } = await syncOnce(remote, 'u1', withTask(phone, 'laundry'), first.meta)
    expect(meta.version).toBe(2)
    expect(remote.calls.get).toBe(downloads)
    expect(remote.rows.get('u1').data.tasks[0].id).toBe('laundry')
  })
})
