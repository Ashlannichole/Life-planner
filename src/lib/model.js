import { todayKey } from './dates.js'

export const APP_NAME = 'Sprout' // Working title — the real name is still TBD.

export const uid = () =>
  Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)

export const DURATIONS = [5, 15, 30, 60, 90]
export const durationLabel = (m) => (m >= 90 ? '90+ min' : `${m} min`)

export const REPEATS = [
  { id: 'none', label: 'No repeat' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'everyX', label: 'Every X days' },
  { id: 'monthly', label: 'Monthly' },
]

export const PARTS = [
  { id: 'morning', label: 'Morning', from: 0, to: 12 * 60 },
  { id: 'afternoon', label: 'Afternoon', from: 12 * 60, to: 17 * 60 },
  { id: 'evening', label: 'Evening', from: 17 * 60, to: 24 * 60 },
]

export const PREFERRED_TIMES = [
  { id: null, label: 'Any time' },
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'weekend', label: 'Weekend' },
]

export const CATEGORIES = [
  { id: 'cleaning', label: 'Cleaning', icon: '🧽' },
  { id: 'cooking', label: 'Cooking', icon: '🍳' },
  { id: 'laundry', label: 'Laundry', icon: '🧺' },
  { id: 'kitchen', label: 'Kitchen', icon: '🍽' },
  { id: 'pets', label: 'Pets', icon: '🐾' },
  { id: 'admin', label: 'Admin', icon: '📋' },
  { id: 'errands', label: 'Errands', icon: '🛒' },
  { id: 'selfcare', label: 'Self-care', icon: '🛁' },
  { id: 'hobby', label: 'Hobby', icon: '🧶' },
  { id: 'social', label: 'Social', icon: '💬' },
  { id: 'other', label: 'Other', icon: '✨' },
]
export const categoryById = (id) => CATEGORIES.find((c) => c.id === id)

// Keyword hints so quick-add can fill in a sensible category and type.
const CATEGORY_HINTS = [
  ['laundry', /laundry|wash (clothes|sheets|towels|jerseys)|fold|iron/i],
  ['cleaning', /clean|vacuum|dust|mop|dishes|tidy|declutter|scrub|trash|bathroom|kitchen/i],
  ['cooking', /cook|meal ?prep|dinner|lunch|breakfast|groceries list/i],
  ['hobby', /read|crochet|knit|bak(e|ing)|paint|draw|sew|garden|guitar|piano|game|puzzle|craft|write|journal|sketch/i],
  ['admin', /pay|bill|email|call|tax|insurance|appointment|book|schedule|renew|form|budget/i],
  ['errands', /buy|shop|pick up|drop off|return|post office|pharmacy|grocer/i],
  ['selfcare', /walk|run|yoga|stretch|workout|gym|nap|bath|meditat|skincare/i],
  ['social', /text|visit|friend|mom|dad|family|coffee with|birthday/i],
]
const WANT_CATEGORIES = new Set(['hobby', 'selfcare', 'social'])

export function guessFromTitle(title) {
  for (const [category, re] of CATEGORY_HINTS) {
    if (re.test(title)) {
      return { category, type: WANT_CATEGORIES.has(category) ? 'want' : 'need' }
    }
  }
  return { category: null, type: 'need' }
}

export function makeTask(fields = {}) {
  const guess = fields.title ? guessFromTitle(fields.title) : { category: null, type: 'need' }
  return {
    id: uid(),
    title: '',
    type: guess.type,
    minutes: 30,
    repeat: 'none',
    everyDays: 3,
    preferredTime: null,
    category: guess.category,
    createdAt: Date.now(),
    startDate: todayKey(),
    doneAt: null,
    deadline: null,
    notBefore: null,
    onDate: null, // set by the user: do it on this day
    eventId: null,
    prepDaysBefore: null,
    ...fields,
  }
}

export function makeTemplate(name, blocks = []) {
  return { id: uid(), name, blocks: blocks.map((b) => ({ id: uid(), ...b })) }
}

export const DEFAULT_TEMPLATE_BLOCKS = [
  { days: [1, 2, 3, 4, 5], start: '17:30', end: '21:00' },
  { days: [6], start: '09:00', end: '18:00' },
  { days: [0], start: '10:00', end: '16:00' },
]

export const TRIP_PACKING = [
  'Phone charger',
  'Toothbrush & toiletries',
  'Medications',
  'Pajamas',
  'Underwear & socks',
  'Outfits for each day',
  'Comfy shoes',
  'ID / passport',
  'Snacks for travel',
]

export const BUILT_IN_PREP = [
  {
    id: 'trip',
    name: 'Trip',
    builtIn: true,
    packing: TRIP_PACKING,
    items: [
      { id: 'flights', title: 'Book flights / transportation', daysBefore: 42, minutes: 30, category: 'admin' },
      { id: 'lodging', title: 'Book lodging', daysBefore: 35, minutes: 30, category: 'admin' },
      { id: 'timeoff', title: 'Request time off', daysBefore: 30, minutes: 15, category: 'admin' },
      { id: 'care', title: 'Arrange pet / plant care', daysBefore: 10, minutes: 15, category: 'admin' },
      { id: 'laundry', title: 'Do laundry', daysBefore: 3, minutes: 60, category: 'laundry' },
      { id: 'pack', title: 'Pack', daysBefore: 1, minutes: 60, category: 'other' },
    ],
  },
]

export function initialState() {
  const normal = makeTemplate('Normal', DEFAULT_TEMPLATE_BLOCKS)
  return {
    version: 1,
    onboarded: false,
    tasks: [],
    completions: [],
    history: { days: {}, tasks: {} },
    events: [],
    templates: [normal],
    activeTemplateId: normal.id,
    prepTemplates: [],
    packingLists: [],
    recipes: [],
    mealPlan: {},
    groceries: { checks: {}, extras: [] },
    pins: {},
    deferrals: {},
    dayOrder: {},
    plant: {
      current: { typeId: 'sunflower', potId: 'terracotta', water: 0, startedAt: todayKey() },
      garden: [],
      unlockedPlants: ['sunflower', 'tulip', 'lavender'],
      unlockedPots: ['terracotta', 'sky'],
      unlockLog: [],
      totalWater: 0,
    },
    settings: {
      sound: true,
      buffer: 0.2,
      recapSeen: null,
      nutrition: false,
      calorieTarget: null,
      theme: 'sage',
    },
    energy: {},
    workouts: {},
    milestones: {},
    unlockedThemes: ['sage'],
    planSnapshot: null,
  }
}
