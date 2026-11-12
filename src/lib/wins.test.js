import { describe, expect, it } from 'vitest'
import { initialState } from './model.js'
import { jarCount, makeWin, pullWin, winSlips } from './wins.js'

const withWins = () => ({
  ...initialState(),
  completions: [
    { id: 'c1', date: '2026-10-01', title: 'Dishes', type: 'need' },
    { id: 'c2', date: '2026-10-05', title: 'Read', type: 'want' },
  ],
  history: { days: { '2026-06-01': { n: 3, f: 1, t: ['Painted'] } }, tasks: {} },
  wins: [{ id: 'w1', date: '2026-10-03', text: 'Called mom' }],
})

describe('wins jar', () => {
  it('collects check-offs, older fun things and your own wins, newest first', () => {
    const slips = winSlips(withWins())
    expect(slips.map((s) => s.text)).toEqual(['Read', 'Called mom', 'Dishes', 'Painted'])
    expect(slips.find((s) => s.text === 'Called mom').own).toBe(true)
  })

  it('counts everything ever done, even without names', () => {
    expect(jarCount(withWins())).toBe(2 + 3 + 1)
  })

  it('never pulls the same slip twice in a row', () => {
    const slips = winSlips(withWins())
    for (let i = 0; i < 20; i++) {
      const r = (i % 10) / 10
      expect(pullWin(slips, () => r, slips[0].id).id).not.toBe(slips[0].id)
    }
    expect(pullWin([], Math.random)).toBeNull()
  })

  it('trims your own wins', () => {
    expect(makeWin('  got up  ', '2026-10-09')).toMatchObject({ text: 'got up', date: '2026-10-09' })
  })
})
