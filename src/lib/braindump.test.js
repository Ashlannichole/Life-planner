import { describe, expect, it } from 'vitest'
import { dayFromWord, parseDump, parseItem, splitDump } from './braindump.js'

const TUE = '2026-10-06'

describe('brain dump', () => {
  it('splits lines, bullets and comma lists', () => {
    expect(splitDump('- laundry\n* call mom\n1. taxes\n\n[ ] dishes')).toEqual(['laundry', 'call mom', 'taxes', 'dishes'])
    expect(splitDump('laundry, call mom; dishes')).toEqual(['laundry', 'call mom', 'dishes'])
  })

  it('understands days', () => {
    expect(dayFromWord('tomorrow', TUE)).toBe('2026-10-07')
    expect(dayFromWord('Fri', TUE)).toBe('2026-10-09')
    expect(dayFromWord('tuesday', TUE)).toBe(TUE)
    expect(dayFromWord('mon', TUE)).toBe('2026-10-12')
  })

  it('pulls days, deadlines and times out of the words', () => {
    expect(parseItem('call the dentist tomorrow', TUE)).toMatchObject({ title: 'Call the dentist', onDate: '2026-10-07', category: 'admin' })
    expect(parseItem('pay rent by friday', TUE)).toMatchObject({ title: 'Pay rent', deadline: '2026-10-09' })
    expect(parseItem('crochet 1h', TUE)).toMatchObject({ title: 'Crochet', minutes: 60, type: 'want' })
    expect(parseItem('tidy desk (15 min) on sat', TUE)).toMatchObject({ title: 'Tidy desk', minutes: 15, onDate: '2026-10-10' })
  })

  it('leaves plain items alone', () => {
    const [item] = parseDump('Monstera repot', TUE)
    expect(item.title).toBe('Monstera repot')
    expect(item.onDate).toBeUndefined()
  })
})
