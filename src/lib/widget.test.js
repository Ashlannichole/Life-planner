import { describe, expect, it } from 'vitest'
import { initialState } from './model.js'
import { plantEmoji, widgetData } from './widget.js'

const day = (key, titles, extra = {}) => ({ key, items: titles.map((title, i) => ({ title, minutes: 10 * (i + 1) })), ...extra })

describe('widget data', () => {
  it('shows the next things today, what is done, and switches to tomorrow at midnight', () => {
    const state = { ...initialState(), completions: [{ id: 'c', date: '2026-10-12', title: 'Dishes' }] }
    const schedule = { days: [day('2026-10-12', ['Laundry', 'Call mom']), day('2026-10-13', ['Vacuum'], { bedDay: true })] }
    const w = widgetData(state, schedule, '2026-10-12')
    expect(w.today).toMatchObject({ day: '2026-10-12', left: 2, done: 1, next: [{ title: 'Laundry', minutes: 10 }, { title: 'Call mom', minutes: 20 }] })
    expect(w.tomorrow).toMatchObject({ day: '2026-10-13', done: 0, bedDay: true })
  })

  it('still has a today card when nothing is planned', () => {
    const w = widgetData(initialState(), { days: [] }, '2026-10-12')
    expect(w.today).toMatchObject({ day: '2026-10-12', next: [], left: 0 })
    expect(w.tomorrow).toBeNull()
  })

  it('shows the plant growing, and its own flower in bloom', () => {
    expect(plantEmoji({ typeId: 'sunflower', water: 0 })).toBe('🌰')
    expect(plantEmoji({ typeId: 'sunflower', water: 9 })).toBe('🌿')
    expect(plantEmoji({ typeId: 'sunflower', water: 40 })).toBe('🌻')
    expect(plantEmoji({ typeId: 'bat-flower', water: 40 })).toBe('🦇')
  })
})
