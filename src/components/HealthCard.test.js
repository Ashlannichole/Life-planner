import { describe, expect, it } from 'vitest'
import { healthNudge } from './HealthCard.jsx'

describe('health nudge', () => {
  it('offers a lighter day after a short night or a low HRV, not otherwise', () => {
    expect(healthNudge({ sleepMinutes: 310 })).toBe('You slept 5h 10m last night.')
    expect(healthNudge({ sleepMinutes: 450, hrv: 30, hrvBaseline: 50 })).toMatch(/run down/)
    expect(healthNudge({ sleepMinutes: 450, hrv: 48, hrvBaseline: 50 })).toBeNull()
    expect(healthNudge(null)).toBeNull()
  })
})
