import { describe, expect, it } from 'vitest'
import { HOLIDAY_THEMES, SEASONAL_THEMES, isMyBirthday, seasonFor, themeFor } from './seasons.js'

describe('seasonal themes', () => {
  it('has one theme per month', () => {
    expect(SEASONAL_THEMES).toHaveLength(12)
    expect(new Set(SEASONAL_THEMES.map((t) => t.month)).size).toBe(12)
  })

  it('picks pumpkin in October and holly in December', () => {
    expect(seasonFor('2026-10-06').name).toBe('Pumpkin')
    expect(seasonFor('2026-12-24').emoji).toBe('🎄')
  })
})

describe('holiday themes', () => {
  const id = (day, sd) => themeFor(day, sd).id

  it('dresses up for each holiday until the day has passed', () => {
    expect(id('2026-10-01')).toBe('holiday-halloween')
    expect(id('2026-10-31')).toBe('holiday-halloween')
    expect(id('2026-11-01')).toBe('holiday-thanksgiving')
    expect(id('2026-11-26')).toBe('holiday-thanksgiving') // Thanksgiving 2026
    expect(id('2026-11-27')).toBe('holiday-christmas')
    expect(id('2026-12-25')).toBe('holiday-christmas')
    expect(id('2026-12-26')).toBe('holiday-new-year')
    expect(id('2027-01-01')).toBe('holiday-new-year')
    expect(id('2027-02-01')).toBe('holiday-valentines')
    expect(id('2027-02-14')).toBe('holiday-valentines')
    expect(id('2027-02-15')).toBe('holiday-st-patricks')
    expect(id('2027-03-17')).toBe('holiday-st-patricks')
    expect(id('2027-03-18')).toBe('holiday-easter')
    expect(id('2027-03-28')).toBe('holiday-easter') // Easter 2027
    expect(id('2027-06-20')).toBe('holiday-july-4')
    expect(id('2027-07-04')).toBe('holiday-july-4')
  })

  it('falls back to the month, with gentle background bits, between holidays', () => {
    const jan = themeFor('2027-01-10')
    expect(jan.id).toBe('season-1')
    expect(jan.decor.gentle).toBe(true)
    expect(themeFor('2027-07-05').id).toBe('season-7')
    expect(themeFor('2027-03-29').id).toBe('season-3') // the day after Easter
  })

  it('every holiday theme has lights and critters', () => {
    for (const t of HOLIDAY_THEMES) {
      expect(t.decor.charms.length).toBeGreaterThan(1)
      expect(t.decor.critters.length).toBeGreaterThan(1)
    }
  })

  it('throws a party on your own birthday', () => {
    const me = [{ id: 'me', kind: 'birthday', self: true, month: 10, day: 20 }]
    expect(id('2026-10-20', me)).toBe('holiday-birthday')
    expect(id('2026-10-21', me)).toBe('holiday-halloween')
    expect(isMyBirthday('2027-02-28', [{ self: true, month: 2, day: 29 }])).toBe(true)
    expect(isMyBirthday('2028-02-28', [{ self: true, month: 2, day: 29 }])).toBe(false)
  })
})
