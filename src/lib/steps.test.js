import { describe, expect, it } from 'vitest'
import { makeSteps, stepProgress, suggestSteps } from './steps.js'

describe('make it smaller', () => {
  it('suggests tiny steps for common scary tasks', () => {
    expect(suggestSteps('Do laundry')[0]).toBe('Grab one armful of clothes')
    expect(suggestSteps('Fold laundry')[0]).toMatch(/clean pile/)
    expect(suggestSteps('Pay the phone bill')[0]).toMatch(/bill/)
    expect(suggestSteps('Call the dentist')[0]).toMatch(/phone number/)
    expect(suggestSteps('Clean my room')[0]).toMatch(/timer/)
  })

  it('always has something, even for an unknown task', () => {
    const steps = suggestSteps('Fix the bike')
    expect(steps.length).toBeGreaterThan(2)
    expect(steps[1]).toContain('fix the bike')
  })

  it('saves steps and tracks progress', () => {
    const steps = makeSteps(['One', '  ', 'Two'])
    expect(steps).toHaveLength(2)
    expect(steps[0]).toMatchObject({ title: 'One', done: false })
    expect(stepProgress({ steps: [{ done: true }, { done: false }] })).toEqual({ done: 1, total: 2 })
    expect(stepProgress({})).toBeNull()
  })
})
