import { describe, expect, it } from 'vitest'
import { mergeById, mergeMap, mergeState, syncable } from './merge.js'
import { initialState, makeTask } from './model.js'

const t = (id, fields = {}) => ({ id, title: id, ...fields })

describe('mergeById', () => {
  const base = [t('a'), t('b'), t('c')]

  it('keeps additions from both sides', () => {
    const merged = mergeById(base, [...base, t('phone')], [...base, t('ipad')])
    expect(merged.map((x) => x.id)).toEqual(['a', 'b', 'c', 'phone', 'ipad'])
  })

  it('keeps deletions from either side', () => {
    const merged = mergeById(base, [t('a'), t('c')], [t('a'), t('b')])
    expect(merged.map((x) => x.id)).toEqual(['a'])
  })

  it('takes each side’s edits, and this device when both edited', () => {
    const local = [t('a', { title: 'A phone' }), t('b'), t('c', { title: 'C phone' })]
    const remote = [t('a'), t('b', { title: 'B ipad' }), t('c', { title: 'C ipad' })]
    const merged = mergeById(base, local, remote)
    expect(merged.map((x) => x.title)).toEqual(['A phone', 'B ipad', 'C phone'])
  })

  it('does not lose an edit when the other side deleted the record', () => {
    const merged = mergeById(base, [t('a', { title: 'edited' }), t('b'), t('c')], [t('b'), t('c')])
    expect(merged.find((x) => x.id === 'a').title).toBe('edited')
  })
})

describe('mergeMap', () => {
  it('merges keys three ways', () => {
    const merged = mergeMap({ x: 1, y: 1, z: 1 }, { x: 2, y: 1 }, { x: 1, y: 3, z: 1, w: 4 })
    expect(merged).toEqual({ x: 2, y: 3, w: 4 })
  })
})

describe('mergeState', () => {
  const base = { ...initialState(), onboarded: true, tasks: [makeTask({ id: 'dishes', title: 'Dishes' })] }

  it('combines check-offs and plant watering from two devices', () => {
    const phone = {
      ...base,
      completions: [{ id: 'c1', taskId: 'dishes', date: '2026-10-01' }],
      plant: { ...base.plant, current: { ...base.plant.current, water: 1 }, totalWater: 1 },
    }
    const ipad = {
      ...base,
      completions: [{ id: 'c2', taskId: 'dishes', date: '2026-10-01' }],
      plant: { ...base.plant, current: { ...base.plant.current, water: 2 }, totalWater: 2 },
    }
    const merged = mergeState(base, phone, ipad)
    expect(merged.completions.map((c) => c.id).sort()).toEqual(['c1', 'c2'])
    expect(merged.plant.current.water).toBe(3)
    expect(merged.plant.totalWater).toBe(3)
  })

  it('uploads a device’s data on first sign-in without losing the account’s data', () => {
    const device = { ...initialState(), onboarded: true, tasks: [makeTask({ id: 'local', title: 'Local task' })] }
    const account = { ...initialState(), onboarded: true, tasks: [makeTask({ id: 'cloud', title: 'Cloud task' })] }
    const merged = mergeState(null, device, account)
    expect(merged.tasks.map((x) => x.id).sort()).toEqual(['cloud', 'local'])
    expect(merged.templates.some((x) => x.id === merged.activeTemplateId)).toBe(true)
  })

  it('keeps settings changed on each device', () => {
    const phone = { ...base, settings: { ...base.settings, sound: false } }
    const ipad = { ...base, settings: { ...base.settings, theme: 'ocean' } }
    const merged = mergeState(base, phone, ipad)
    expect(merged.settings.sound).toBe(false)
    expect(merged.settings.theme).toBe('ocean')
  })

  it('keeps device-only fields out of what gets synced', () => {
    expect('planSnapshot' in syncable({ ...base, planSnapshot: { date: 'x', ids: [] } })).toBe(false)
  })
})
