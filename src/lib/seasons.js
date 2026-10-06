// Plus: seasonal themes. The accent colors change with the month on their own:
// pumpkin in October, holly in December, pink for February. Holidays dress up even more
// (see HOLIDAY_THEMES below).

export const SEASONAL_THEMES = [
  { id: 'season-1', month: 1, name: 'Fresh start', emoji: '❄️', light: '#4f7fa8', dark: '#93bde0', softLight: '#e3edf6', softDark: '#26364a' },
  { id: 'season-2', month: 2, name: 'Valentine', emoji: '💝', light: '#c0567a', dark: '#eb9bb7', softLight: '#f9e1ea', softDark: '#4a2a36' },
  { id: 'season-3', month: 3, name: 'Spring sprout', emoji: '🌱', light: '#4f9a5c', dark: '#8fd09b', softLight: '#e0f1e2', softDark: '#28402c' },
  { id: 'season-4', month: 4, name: 'Pastel', emoji: '🐣', light: '#8a6fc0', dark: '#c3b0ec', softLight: '#efe8fa', softDark: '#373052' },
  { id: 'season-5', month: 5, name: 'Bloom', emoji: '🌸', light: '#cc6f6f', dark: '#f0a9a9', softLight: '#fbe6e4', softDark: '#4a2e2e' },
  { id: 'season-6', month: 6, name: 'Sunshine', emoji: '☀️', light: '#c08a1e', dark: '#f0c56b', softLight: '#fbf0d6', softDark: '#4a3b1c' },
  { id: 'season-7', month: 7, name: 'Fireworks', emoji: '🎆', light: '#c04848', dark: '#ef9393', softLight: '#fbe3e3', softDark: '#4a2828' },
  { id: 'season-8', month: 8, name: 'Beach day', emoji: '🏖️', light: '#2f8f8a', dark: '#7fd0ca', softLight: '#dcf2f0', softDark: '#1f3f3d' },
  { id: 'season-9', month: 9, name: 'Apple picking', emoji: '🍎', light: '#b4513f', dark: '#e8988a', softLight: '#f8e3de', softDark: '#46291f' },
  { id: 'season-10', month: 10, name: 'Pumpkin', emoji: '🎃', light: '#d0711f', dark: '#f5ab68', softLight: '#fce8d4', softDark: '#4c3219' },
  { id: 'season-11', month: 11, name: 'Harvest', emoji: '🍂', light: '#a5672b', dark: '#dfa871', softLight: '#f5e7d6', softDark: '#43311f' },
  { id: 'season-12', month: 12, name: 'Holly', emoji: '🎄', light: '#2f7a4d', dark: '#7cc499', softLight: '#dcefe3', softDark: '#203c2b' },
]

/** This month's seasonal theme for a day key. */
export function seasonFor(day) {
  return SEASONAL_THEMES[Number(day.slice(5, 7)) - 1]
}

// ---- Holiday themes (Plus) ----
// From a few weeks before each holiday until the day itself, the app dresses up for it:
// colors, a string of lights or charms, little critters peeking over the calendar and a
// few things drifting in the background. Between holidays the monthly theme above shows.
// Your own birthday gets a party theme for the day.

const pad = (n) => String(n).padStart(2, '0')
const key = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`

/**
 * decor:
 *   garland  – the shape hanging on the string: bulb, heart, shamrock, egg, flag, leaf, star
 *   charms   – colors for the garland, in order
 *   critters – who peeks over the calendar (see Critter in ThemeDecor.jsx)
 *   bits     – what drifts in the background, and how (fall, rise, pop)
 */
export const HOLIDAY_THEMES = [
  {
    id: 'holiday-halloween',
    holidayId: 'halloween',
    name: 'Spooky season',
    emoji: '🎃',
    light: '#d0691a', dark: '#f5a35c', softLight: '#fde6d2', softDark: '#4a2f1a',
    window: (y) => [key(y, 10, 1), key(y, 10, 31)],
    decor: { garland: 'bulb', charms: ['#ff8a1f', '#9b5de5', '#7ed957'], critters: ['monster', 'jack', 'ghost', 'monster-green'], bits: ['🦇', '🍂', '🍬', '👻'], motion: 'fall' },
  },
  {
    id: 'holiday-thanksgiving',
    holidayId: 'thanksgiving',
    name: 'Cozy harvest',
    emoji: '🦃',
    light: '#a8612a', dark: '#e0a46e', softLight: '#f6e6d4', softDark: '#45301f',
    window: (y) => [key(y, 11, 1), thanksgiving(y)],
    decor: { garland: 'leaf', charms: ['#d9822b', '#b5442e', '#e3b23c', '#8a5a2b'], critters: ['turkey', 'pumpkin', 'acorn'], bits: ['🍂', '🍁', '🌰'], motion: 'fall' },
  },
  {
    id: 'holiday-christmas',
    holidayId: 'christmas',
    name: 'Merry & bright',
    emoji: '🎄',
    light: '#c23b3b', dark: '#ef8f8f', softLight: '#fbe1e1', softDark: '#4a2626',
    window: (y) => [addDay(thanksgiving(y)), key(y, 12, 25)],
    decor: { garland: 'bulb', charms: ['#e63946', '#2a9d8f', '#f4c430', '#3a86ff', '#ff6fb5'], critters: ['reindeer', 'snowman', 'elf'], bits: ['❄️', '❄️', '⭐'], motion: 'fall' },
  },
  {
    id: 'holiday-new-year',
    holidayId: 'nye',
    name: 'Sparkly new year',
    emoji: '🥳',
    light: '#5a55c4', dark: '#a9a6f2', softLight: '#e7e6fb', softDark: '#2f2d52',
    window: (y) => [key(y, 12, 26), key(y + 1, 1, 1)],
    decor: { garland: 'star', charms: ['#f4c430', '#c0c0d8', '#ff6fb5', '#7ad3ff'], critters: ['party', 'star-gold', 'party-pink'], bits: ['✨', '🎉', '⭐'], motion: 'pop' },
  },
  {
    id: 'holiday-valentines',
    holidayId: 'valentines',
    name: 'Lovebugs',
    emoji: '💝',
    light: '#c0507a', dark: '#f09bbb', softLight: '#fbe0ea', softDark: '#4a2836',
    window: (y) => [key(y, 2, 1), key(y, 2, 14)],
    decor: { garland: 'heart', charms: ['#ff5d8f', '#ff99bb', '#e63946', '#ffc2d4'], critters: ['heart', 'lovebug', 'heart-pink'], bits: ['💕', '💗', '💌'], motion: 'rise' },
  },
  {
    id: 'holiday-st-patricks',
    holidayId: 'st-patricks',
    name: 'Lucky',
    emoji: '☘️',
    light: '#2e8b4a', dark: '#7fd39a', softLight: '#dcf3e3', softDark: '#1f3f2a',
    window: (y) => [key(y, 2, 15), key(y, 3, 17)],
    decor: { garland: 'shamrock', charms: ['#3bb273', '#1f7a45', '#f4c430', '#7ed957'], critters: ['shamrock', 'leprechaun', 'gold'], bits: ['☘️', '🍀', '🌈'], motion: 'fall' },
  },
  {
    id: 'holiday-easter',
    holidayId: 'easter',
    name: 'Egg hunt',
    emoji: '🐣',
    light: '#8b6cc4', dark: '#c6b3ef', softLight: '#efe8fb', softDark: '#363052',
    window: (y) => [key(y, 3, 18), easterDate(y)],
    decor: { garland: 'egg', charms: ['#ffb3c6', '#bde0fe', '#fff1a8', '#caffbf', '#d8b4fe'], critters: ['bunny', 'chick', 'bunny-gray'], bits: ['🌷', '🥚', '🌸'], motion: 'fall' },
  },
  {
    id: 'holiday-july-4',
    holidayId: 'july-4',
    name: 'Stars & sparklers',
    emoji: '🎆',
    light: '#2f5fae', dark: '#8fb4ef', softLight: '#e0eafa', softDark: '#22324d',
    window: (y) => [key(y, 6, 20), key(y, 7, 4)],
    decor: { garland: 'flag', charms: ['#e63946', '#f1f1f1', '#2f5fae'], critters: ['star-red', 'star-blue', 'popsicle'], bits: ['🎆', '✨', '🎇'], motion: 'pop' },
  },
]

export const BIRTHDAY_THEME = {
  id: 'holiday-birthday',
  name: 'Your birthday',
  emoji: '🎂',
  light: '#c64f9a', dark: '#f0a2d0', softLight: '#fbe2f1', softDark: '#4a2840',
  decor: { garland: 'flag', charms: ['#ff5d8f', '#f4c430', '#3a86ff', '#7ed957', '#9b5de5'], critters: ['cupcake', 'party', 'balloon'], bits: ['🎈', '🎉', '🎊'], motion: 'rise' },
}

// Gentle background bits for the months between holidays.
const MONTH_BITS = {
  1: ['❄️'], 2: ['❄️'], 3: ['🌱'], 4: ['🌸'], 5: ['🌸', '🌼'], 6: ['☀️', '🦋'],
  7: ['☀️'], 8: ['🐚', '🌊'], 9: ['🍎', '🍂'], 10: ['🍂'], 11: ['🍂'], 12: ['❄️'],
}

function thanksgiving(y) {
  // Fourth Thursday of November.
  const first = new Date(y, 10, 1).getDay()
  return key(y, 11, 1 + ((4 - first + 7) % 7) + 21)
}

function easterDate(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451)
  return key(y, Math.floor((h + l - 7 * m + 114) / 31), ((h + l - 7 * m + 114) % 31) + 1)
}

function addDay(day) {
  const [y, m, d] = day.split('-').map(Number)
  const next = new Date(y, m - 1, d + 1)
  return key(next.getFullYear(), next.getMonth() + 1, next.getDate())
}

/** Is today the person's own birthday (Feb 29 birthdays party on Feb 28 in other years)? */
export function isMyBirthday(day, specialDays = []) {
  const me = specialDays.find((sd) => sd.self)
  if (!me) return false
  const [y, m, d] = day.split('-').map(Number)
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
  const bday = me.month === 2 && me.day === 29 && !leap ? 28 : me.day
  return m === me.month && d === bday
}

/**
 * The theme to show on a day: your birthday, then a holiday that's coming up (until the
 * day itself has passed), otherwise the month's theme with a few gentle background bits.
 */
export function themeFor(day, specialDays = []) {
  if (isMyBirthday(day, specialDays)) return BIRTHDAY_THEME
  const y = Number(day.slice(0, 4))
  for (const t of HOLIDAY_THEMES) {
    for (const year of [y - 1, y]) {
      const [from, to] = t.window(year)
      if (day >= from && day <= to) return t
    }
  }
  const season = seasonFor(day)
  return { ...season, decor: { bits: MONTH_BITS[season.month], motion: 'fall', gentle: true } }
}
