import { describe, expect, it } from 'vitest'
import { initialState } from './model.js'
import { markOpened } from './welcome.js'

const base = (fields = {}) => ({ ...initialState(), onboarded: true, ...fields })

describe('welcome back', () => {
  it('just remembers the day on a normal open', () => {
    const s = markOpened(base({ settings: { ...initialState().settings, lastOpen: '2026-10-05' } }), '2026-10-06')
    expect(s.settings.lastOpen).toBe('2026-10-06')
    expect(s.settings.welcomeBack).toBeUndefined()
    expect(markOpened(s, '2026-10-06')).toBeNull()
  })

  it('welcomes you back after a few days away and clears the compost pile', () => {
    const tasks = [
      { id: 'a', title: 'Taxes', pushes: 5, compost: true },
      { id: 'b', title: 'Laundry' },
    ]
    const s = markOpened(base({ tasks, settings: { ...initialState().settings, lastOpen: '2026-10-01' } }), '2026-10-06')
    expect(s.settings.welcomeBack).toEqual({ away: 5, on: '2026-10-06' })
    expect(s.tasks[0]).toMatchObject({ pushes: 0, compost: false })
    expect(s.tasks[1]).toBe(tasks[1])
  })

  it('does not greet a brand-new device', () => {
    expect(markOpened(base(), '2026-10-06').settings.welcomeBack).toBeUndefined()
  })
})
