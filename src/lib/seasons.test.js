import { describe, expect, it } from 'vitest'
import { SEASONAL_THEMES, seasonFor } from './seasons.js'

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
