import { describe, expect, it } from 'vitest'
import { BUILT_IN_PREP } from './model.js'
import { allPrepTemplates, EXTRA_TRIP_PREP, fitDaysBefore, makePrepTasks, prepSuggestions, templateWithItems } from './prep.js'

const trip = BUILT_IN_PREP.find((t) => t.id === 'trip')

describe('prepSuggestions', () => {
  it('offers extra trip prep, skipping what the event already has', () => {
    const titles = prepSuggestions(true, ['hold MAIL / packages ', 'Pack']).map((s) => s.title)
    expect(titles).not.toContain('Hold mail / packages')
    expect(titles).toContain('Check passport / ID')
    expect(titles.length).toBe(EXTRA_TRIP_PREP.length - 1)
  })

  it('offers nothing for non-trips', () => {
    expect(prepSuggestions(false, [])).toEqual([])
  })
})

describe('fitDaysBefore', () => {
  it('keeps the choice when there is time', () => {
    expect(fitDaysBefore('2026-10-01', '2026-10-20', 7)).toBe(7)
  })

  it('pulls the deadline up to today when the event is close', () => {
    expect(fitDaysBefore('2026-10-01', '2026-10-04', 7)).toBe(3)
    expect(fitDaysBefore('2026-10-01', '2026-10-01', 3)).toBe(0)
  })

  it('never goes negative for events already underway', () => {
    expect(fitDaysBefore('2026-10-05', '2026-10-01', 3)).toBe(0)
  })
})

describe('saving extras into a template', () => {
  it('adds new items once and turns a built-in into the person’s own version', () => {
    const next = templateWithItems(trip, [
      { title: 'Hold mail / packages', daysBefore: 5, minutes: 15 },
      { title: 'pack', daysBefore: 1, minutes: 60 },
    ])
    expect(next.id).toBe('trip')
    expect(next.builtIn).toBe(false)
    expect(next.items.length).toBe(trip.items.length + 1)
    expect(next.items.at(-1).id).toBeTruthy()
  })

  it('their version replaces the built-in instead of showing twice', () => {
    const mine = templateWithItems(trip, [{ title: 'Hold mail / packages', daysBefore: 5, minutes: 15 }])
    const all = allPrepTemplates({ prepTemplates: [mine] })
    expect(all.filter((t) => t.id === 'trip')).toEqual([mine])
  })
})

describe('makePrepTasks', () => {
  it('schedules extra prep backward from the event', () => {
    const [task] = makePrepTasks({ id: 'e1', date: '2026-10-20' }, [{ title: 'Hold mail / packages', daysBefore: 5, minutes: 15 }])
    expect(task.eventId).toBe('e1')
    expect(task.deadline).toBe('2026-10-15')
    expect(task.prepDaysBefore).toBe(5)
  })
})
