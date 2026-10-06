import { describe, expect, it } from 'vitest'
import { easter, holidaysBetween, holidaysOn, holidayToAsk, nthWeekday, snoozeUntil, untilText } from './holidays.js'

describe('holiday dates', () => {
  it('works out Easter', () => {
    expect(easter(2025)).toBe('2025-04-20')
    expect(easter(2026)).toBe('2026-04-05')
    expect(easter(2027)).toBe('2027-03-28')
  })

  it('works out the floating holidays', () => {
    expect(nthWeekday(2026, 11, 4, 4)).toBe('2026-11-26') // Thanksgiving
    expect(nthWeekday(2027, 11, 4, 4)).toBe('2027-11-25')
    expect(nthWeekday(2026, 5, 0, 2)).toBe('2026-05-10') // Mother's Day
    expect(nthWeekday(2026, 6, 0, 3)).toBe('2026-06-21') // Father's Day
    expect(nthWeekday(2026, 5, 1, -1)).toBe('2026-05-25') // Memorial Day
    expect(nthWeekday(2026, 9, 1, 1)).toBe('2026-09-07') // Labor Day
  })

  it('lists holidays across a year boundary in order', () => {
    const names = holidaysBetween('2026-12-20', '2027-01-05').map((h) => h.name)
    expect(names).toEqual(['Christmas', 'New Year’s Eve', 'New Year’s Day'])
    expect(holidaysOn('2026-11-26')[0].key).toBe('thanksgiving-2026')
  })
})

describe('asking about holidays', () => {
  const halloweenDone = { 'halloween-2026': { answer: 'candy' } }

  it('asks about the soonest holiday first', () => {
    expect(holidayToAsk({}, '2026-10-10').id).toBe('halloween') // 21 days out
  })

  it('asks about Thanksgiving about a month ahead', () => {
    expect(holidayToAsk(halloweenDone, '2026-10-10')).toBeNull() // too early (47 days)
    expect(holidayToAsk(halloweenDone, '2026-10-22').id).toBe('thanksgiving') // 35 days out
  })

  it('stops asking once answered, and waits while snoozed', () => {
    expect(holidayToAsk({ ...halloweenDone, 'thanksgiving-2026': { answer: 'hosting' } }, '2026-10-25')).toBeNull()
    expect(holidayToAsk({ ...halloweenDone, 'thanksgiving-2026': { snoozeUntil: '2026-10-29' } }, '2026-10-25')).toBeNull()
    expect(holidayToAsk({ ...halloweenDone, 'thanksgiving-2026': { snoozeUntil: '2026-10-29' } }, '2026-10-29').id).toBe('thanksgiving')
  })

  it('moves on to the next holiday once one is answered', () => {
    const plans = { 'thanksgiving-2026': { answer: 'going' } }
    expect(holidayToAsk(plans, '2026-11-12').id).toBe('christmas') // 43 days out
  })

  it('never asks about calendar-only holidays', () => {
    expect(holidayToAsk({}, '2026-08-25')).toBeNull() // Labor Day is close, but has no question
  })

  it('words the wait and the snooze sensibly', () => {
    expect(untilText('2026-10-22', '2026-11-26')).toBe('in 5 weeks')
    expect(untilText('2026-11-20', '2026-11-26')).toBe('in 6 days')
    expect(snoozeUntil('2026-10-22', '2026-11-26')).toBe('2026-10-26')
    expect(snoozeUntil('2026-11-22', '2026-11-26')).toBe('2026-11-23')
  })
})

describe('birthdays', () => {
  const mom = { id: 'm1', kind: 'birthday', name: 'Mom', month: 3, day: 14, year: 1965 }
  const leapling = { id: 'l1', name: 'Leo', month: 2, day: 29 }

  it('shows a birthday every year, with the age when the year is known', () => {
    const [b] = holidaysOn('2027-03-14', [mom])
    expect(b.name).toBe('Mom’s birthday')
    expect(b.detail).toBe('turns 62')
    expect(b.key).toBe('day-m1-2027')
  })

  it('puts a Feb 29 birthday on Feb 28 in other years', () => {
    expect(holidaysOn('2027-02-28', [leapling])).toHaveLength(1)
    expect(holidaysOn('2028-02-29', [leapling])).toHaveLength(1)
  })

  it('asks about a birthday three weeks ahead, with gift ideas', () => {
    const ask = holidayToAsk({}, '2027-02-25', [mom])
    expect(ask.name).toBe('Mom’s birthday')
    expect(ask.answers.map((a) => a.label)).toContain('Gift & card')
    expect(ask.answers.find((a) => a.id === 'gift').prep[0].title).toBe('Pick out a gift for Mom')
  })
})

describe('anniversaries', () => {
  const ours = { id: 'a1', kind: 'anniversary', name: 'Our', month: 6, day: 20, year: 2020 }
  const parents = { id: 'a2', kind: 'anniversary', name: 'Mom & Dad', month: 9, day: 2 }

  it('shows our anniversary with the years', () => {
    const [a] = holidaysOn('2026-06-20', [ours])
    expect(a.name).toBe('Our anniversary')
    expect(a.detail).toBe('6 years')
    expect(a.emoji).toBe('💍')
  })

  it('offers a date night for ours and a card or call for someone else’s', () => {
    expect(holidayToAsk({}, '2026-06-01', [ours]).answers.map((x) => x.label)).toContain('Plan a date night')
    const theirs = holidayToAsk({}, '2026-08-20', [parents])
    expect(theirs.name).toBe('Mom & Dad’s anniversary')
    expect(theirs.answers.map((x) => x.label)).toContain('Send a card')
  })
})
