// Holidays: shown on the calendar for everyone, and (with holiday prep on) asked
// about ahead of time so the planning happens without anyone having to remember.
// US holidays to start; dates are worked out for any year.

import { addDays, diffDays } from './dates.js'

const pad = (n) => String(n).padStart(2, '0')
const key = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`

/** The nth (1-based) given weekday (0 = Sunday) of a month; n = -1 for the last one. */
export function nthWeekday(year, month, weekday, n) {
  if (n > 0) {
    const first = new Date(year, month - 1, 1).getDay()
    return key(year, month, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7)
  }
  const lastDate = new Date(year, month, 0).getDate()
  const last = new Date(year, month - 1, lastDate).getDay()
  return key(year, month, lastDate - ((last - weekday + 7) % 7))
}

/** Western Easter Sunday (anonymous Gregorian algorithm). */
export function easter(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return key(year, month, day)
}

// Prep items: daysBefore counts back from the holiday, like event prep.
const t = (title, daysBefore, minutes = 30, category = 'other') => ({ title, daysBefore, minutes, category })

const GIFT_PLAN = [t('Make a gift list', 40, 30, 'admin'), t('Buy gifts', 21, 90, 'errands'), t('Wrap gifts', 3, 60), t('Send holiday cards', 14, 60, 'admin')]

/**
 * Each holiday: when it falls, an emoji, how many days ahead to ask, and the answers
 * offered. An answer can add an all-day event (`event`) and a set of prep tasks.
 * Holidays without `answers` just appear on the calendar.
 */
export const HOLIDAYS = [
  { id: 'new-year', name: 'New Year’s Day', emoji: '🎆', date: (y) => key(y, 1, 1) },
  {
    id: 'valentines',
    name: 'Valentine’s Day',
    emoji: '💝',
    date: (y) => key(y, 2, 14),
    askDays: 21,
    question: 'Celebrating Valentine’s Day?',
    answers: [
      { id: 'yes', label: 'Yes, with someone', prep: [t('Book a reservation', 14, 15, 'admin'), t('Pick out a gift', 10, 30, 'errands'), t('Get a card', 3, 15, 'errands')] },
      { id: 'skip', label: 'Not this year' },
    ],
  },
  { id: 'st-patricks', name: 'St. Patrick’s Day', emoji: '☘️', date: (y) => key(y, 3, 17) },
  {
    id: 'easter',
    name: 'Easter',
    emoji: '🐣',
    date: easter,
    askDays: 28,
    question: 'What are your Easter plans?',
    answers: [
      { id: 'hosting', label: 'Hosting', event: 'Easter (hosting)', prep: [t('Invite people', 21, 15, 'social'), t('Plan the menu', 10, 30, 'kitchen'), t('Grocery run', 2, 60, 'errands'), t('Tidy up and set the table', 1, 60, 'cleaning')] },
      { id: 'going', label: 'Going to someone’s', event: 'Easter', prep: [t('Ask what to bring', 10, 5, 'social'), t('Make your dish', 1, 60, 'kitchen')] },
      { id: 'baskets', label: 'Just baskets & eggs', prep: [t('Fill Easter baskets', 3, 45, 'other'), t('Dye eggs', 2, 45, 'other')] },
      { id: 'skip', label: 'Not this year' },
    ],
  },
  {
    id: 'mothers-day',
    name: 'Mother’s Day',
    emoji: '💐',
    date: (y) => nthWeekday(y, 5, 0, 2),
    askDays: 21,
    question: 'Doing something for Mother’s Day?',
    answers: [
      { id: 'yes', label: 'Yes', prep: [t('Pick out a gift', 10, 30, 'errands'), t('Plan brunch or a visit', 10, 15, 'social'), t('Get a card', 3, 15, 'errands')] },
      { id: 'skip', label: 'Not this year' },
    ],
  },
  { id: 'memorial-day', name: 'Memorial Day', emoji: '🇺🇸', date: (y) => nthWeekday(y, 5, 1, -1) },
  {
    id: 'fathers-day',
    name: 'Father’s Day',
    emoji: '👔',
    date: (y) => nthWeekday(y, 6, 0, 3),
    askDays: 21,
    question: 'Doing something for Father’s Day?',
    answers: [
      { id: 'yes', label: 'Yes', prep: [t('Pick out a gift', 10, 30, 'errands'), t('Plan a meal or a visit', 10, 15, 'social'), t('Get a card', 3, 15, 'errands')] },
      { id: 'skip', label: 'Not this year' },
    ],
  },
  {
    id: 'july-4',
    name: 'Fourth of July',
    emoji: '🎆',
    date: (y) => key(y, 7, 4),
    askDays: 21,
    question: 'Fourth of July plans?',
    answers: [
      { id: 'hosting', label: 'Hosting a cookout', event: 'Fourth of July (hosting)', prep: [t('Invite people', 14, 15, 'social'), t('Plan the menu', 7, 30, 'kitchen'), t('Grocery run', 2, 60, 'errands'), t('Tidy up the yard', 1, 60, 'cleaning')] },
      { id: 'going', label: 'Going to one', event: 'Fourth of July', prep: [t('Ask what to bring', 7, 5, 'social'), t('Pick up something to bring', 1, 30, 'errands')] },
      { id: 'skip', label: 'Not this year' },
    ],
  },
  { id: 'labor-day', name: 'Labor Day', emoji: '🇺🇸', date: (y) => nthWeekday(y, 9, 1, 1) },
  {
    id: 'halloween',
    name: 'Halloween',
    emoji: '🎃',
    date: (y) => key(y, 10, 31),
    askDays: 28,
    question: 'Halloween plans?',
    answers: [
      { id: 'trick', label: 'Trick-or-treating', prep: [t('Sort out costumes', 14, 60, 'errands'), t('Carve pumpkins', 3, 60, 'other')] },
      { id: 'candy', label: 'Handing out candy', prep: [t('Decorate the porch', 7, 60, 'other'), t('Buy candy', 5, 30, 'errands'), t('Carve pumpkins', 3, 60, 'other')] },
      { id: 'party', label: 'Going to a party', prep: [t('Sort out a costume', 14, 60, 'errands')] },
      { id: 'skip', label: 'Not this year' },
    ],
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    emoji: '🦃',
    date: (y) => nthWeekday(y, 11, 4, 4),
    askDays: 35,
    question: 'Do you have your Thanksgiving plans set?',
    answers: [
      {
        id: 'hosting',
        label: 'Hosting',
        event: 'Thanksgiving (hosting)',
        prep: [
          t('Invite people', 21, 15, 'social'),
          t('Plan the menu', 14, 30, 'kitchen'),
          t('Order the turkey', 14, 15, 'errands'),
          t('Make the grocery list', 7, 30, 'kitchen'),
          t('Start thawing the turkey', 4, 5, 'kitchen'),
          t('Grocery run', 3, 90, 'errands'),
          t('Clean and set the table', 1, 60, 'cleaning'),
          t('Cook anything that can be made ahead', 1, 90, 'cooking'),
        ],
      },
      { id: 'going', label: 'Going to someone’s', event: 'Thanksgiving', prep: [t('Ask what to bring', 14, 5, 'social'), t('Buy ingredients', 3, 45, 'errands'), t('Make your dish', 1, 90, 'cooking')] },
      { id: 'skip', label: 'Not this year' },
    ],
  },
  {
    id: 'christmas',
    name: 'Christmas',
    emoji: '🎄',
    date: (y) => key(y, 12, 25),
    askDays: 45,
    question: 'What are your Christmas plans?',
    answers: [
      {
        id: 'hosting',
        label: 'Hosting',
        event: 'Christmas (hosting)',
        prep: [t('Decorate', 25, 90), ...GIFT_PLAN, t('Plan the menu', 14, 30, 'kitchen'), t('Grocery run', 3, 90, 'errands'), t('Clean the house', 1, 90, 'cleaning')],
      },
      { id: 'visiting', label: 'Visiting family', event: 'Christmas', prep: [t('Book travel', 30, 30, 'admin'), ...GIFT_PLAN, t('Pack', 2, 60)] },
      { id: 'home', label: 'Staying home', prep: [t('Decorate', 25, 90), ...GIFT_PLAN] },
      { id: 'skip', label: 'Not celebrating' },
    ],
  },
  {
    id: 'nye',
    name: 'New Year’s Eve',
    emoji: '🥂',
    date: (y) => key(y, 12, 31),
    askDays: 21,
    question: 'New Year’s Eve plans?',
    answers: [
      { id: 'hosting', label: 'Hosting', event: 'New Year’s Eve (hosting)', prep: [t('Invite people', 14, 15, 'social'), t('Plan food and drinks', 7, 30, 'kitchen'), t('Grocery run', 2, 60, 'errands')] },
      { id: 'going', label: 'Going out', event: 'New Year’s Eve', prep: [t('Make plans or reservations', 10, 15, 'social'), t('Pick out an outfit', 2, 15)] },
      { id: 'skip', label: 'Not this year' },
    ],
  },
]

/**
 * A birthday or anniversary as a yearly "holiday": shown on the calendar, never takes up
 * time, and (with holiday prep on) asked about a few weeks ahead.
 * `special` is { id, kind: 'birthday' | 'anniversary', name, month, day, year? }.
 */
function specialDayOn(sd, y) {
  // Feb 29 dates land on Feb 28 in other years.
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
  const day = sd.month === 2 && sd.day === 29 && !leap ? 28 : sd.day
  const years = sd.year ? y - sd.year : null
  const who = (sd.name || '').trim()
  const base = { id: `day-${sd.id}`, specialId: sd.id, kind: sd.kind || 'birthday', date: key(y, sd.month, day), key: `day-${sd.id}-${y}`, askDays: 21 }
  if (base.kind === 'anniversary') {
    // "Our anniversary", or someone else's: "Mom & Dad’s anniversary".
    const ours = /^(our|us|me)$/i.test(who) || !who
    return {
      ...base,
      name: ours ? 'Our anniversary' : `${who}’s anniversary`,
      detail: years && years > 0 ? `${years} year${years === 1 ? '' : 's'}` : null,
      emoji: '💍',
      question: ours ? 'How do you want to celebrate?' : `Doing something for ${who}?`,
      answers: ours
        ? [
            { id: 'date', label: 'Plan a date night', prep: [t('Book a reservation or plan the night', 14, 15, 'admin'), t('Pick out a gift', 10, 30, 'errands'), t('Get a card', 3, 15, 'errands')] },
            { id: 'gift', label: 'Gift & card', prep: [t('Pick out a gift', 10, 30, 'errands'), t('Get a card', 3, 15, 'errands')] },
            { id: 'skip', label: 'Nothing this year' },
          ]
        : [
            { id: 'card', label: 'Send a card', prep: [t(`Get a card for ${who}`, 5, 15, 'errands')] },
            { id: 'call', label: 'Call or text on the day', prep: [t(`Wish ${who} a happy anniversary`, 0, 5, 'social')] },
            { id: 'skip', label: 'Nothing this year' },
          ],
    }
  }
  if (sd.self) {
    // Your own birthday: plan something for yourself, not a gift for someone else.
    return {
      ...base,
      name: 'Your birthday',
      detail: years && years > 0 ? `you turn ${years}` : null,
      emoji: '🥳',
      question: 'Your birthday is coming up! Want to plan something?',
      answers: [
        {
          id: 'party',
          label: 'Have a party',
          event: 'My birthday party',
          prep: [t('Pick a place and invite people', 18, 30, 'social'), t('Order a cake', 7, 15, 'errands'), t('Plan food and drinks', 7, 30, 'kitchen'), t('Grocery run', 2, 60, 'errands')],
        },
        { id: 'treat', label: 'Treat myself', prep: [t('Book something fun for your birthday', 10, 15, 'admin'), t('Make a birthday wish list', 14, 15, 'other')] },
        { id: 'skip', label: 'Keep it low-key' },
      ],
    }
  }
  return {
    ...base,
    name: `${who}’s birthday`,
    detail: years && years > 0 ? `turns ${years}` : null,
    emoji: '🎂',
    question: `How do you want to celebrate ${who}?`,
    answers: [
      { id: 'gift', label: 'Gift & card', prep: [t(`Pick out a gift for ${who}`, 10, 30, 'errands'), t(`Get a card for ${who}`, 3, 15, 'errands'), t('Wrap the gift', 1, 15)] },
      { id: 'card', label: 'Just a card', prep: [t(`Get a card for ${who}`, 5, 15, 'errands')] },
      { id: 'call', label: 'Call or text on the day', prep: [t(`Wish ${who} a happy birthday`, 0, 5, 'social')] },
      { id: 'skip', label: 'Nothing this year' },
    ],
  }
}

/** Every holiday, birthday and anniversary between two day keys (inclusive), in date order. */
export function holidaysBetween(from, to, specialDays = []) {
  const out = []
  for (let y = Number(from.slice(0, 4)); y <= Number(to.slice(0, 4)); y++) {
    for (const h of HOLIDAYS) {
      const date = h.date(y)
      if (date >= from && date <= to) out.push({ ...h, date, key: `${h.id}-${y}` })
    }
    for (const sd of specialDays) {
      const occ = specialDayOn(sd, y)
      if (occ.date >= from && occ.date <= to) out.push(occ)
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date))
}

/** Holidays, birthdays and anniversaries on one day (for the calendar). */
export function holidaysOn(day, specialDays = []) {
  return holidaysBetween(day, day, specialDays)
}

/**
 * The holiday, birthday or anniversary to ask about today, if any: the soonest one with
 * answers that is within its asking window, hasn't been answered, and isn't snoozed.
 */
export function holidayToAsk(plans = {}, today, specialDays = []) {
  const upcoming = holidaysBetween(addDays(today, 1), addDays(today, 60), specialDays)
  return (
    upcoming.find((h) => {
      if (!h.answers) return false
      if (diffDays(today, h.date) > h.askDays) return false
      const plan = plans[h.key]
      if (plan?.answer) return false
      if (plan?.snoozeUntil && plan.snoozeUntil > today) return false
      return true
    }) || null
  )
}

/** "in 4 weeks", "in 10 days", "next week"… for the question card. */
export function untilText(today, date) {
  const days = diffDays(today, date)
  if (days <= 1) return 'tomorrow'
  if (days < 28) return `in ${days} days`
  const weeks = Math.round(days / 7)
  return `in ${weeks} weeks`
}

/** When "Ask me later" should bring the question back: a few days on, never too close to the day. */
export function snoozeUntil(today, date) {
  const later = addDays(today, 4)
  const latest = addDays(date, -7)
  return later < latest ? later : addDays(today, 1)
}

