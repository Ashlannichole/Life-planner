// Meal planning: reusable recipes, a lunch/dinner plan, and a grocery list
// derived from the plan.

import { addDays, diffDays, rangeKeys } from './dates.js'

export const MEAL_SLOTS = [
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
]

export const PLAN_DAYS = 7

const UNITS =
  'cups?|c|tbsp|tablespoons?|tsp|teaspoons?|g|grams?|kg|lbs?|pounds?|oz|ounces?|ml|l|liters?|litres?|cans?|jars?|packs?|packages?|bags?|boxes?|bunch(?:es)?|cloves?|heads?|slices?|pinch(?:es)?|handfuls?|sticks?|dozen'
const QTY = '(?:\\d+(?:[.,/]\\d+)?|[½¼¾⅓⅔])(?:\\s*(?:\\d+\\/\\d+|[½¼¾⅓⅔]))?(?:\\s*-\\s*\\d+)?'
const INGREDIENT_RE = new RegExp(`^(${QTY}(?:\\s*(?:${UNITS})\\b\\.?)?(?:\\s+of)?)\\s+(.+)$`, 'i')

/** "2 cups rice" → { amount: "2 cups", name: "rice" }. Anything else is just a name. */
export function parseIngredient(line) {
  const text = line.replace(/^[-*•]\s*/, '').trim()
  if (!text) return null
  const m = text.match(INGREDIENT_RE)
  if (m) return { amount: m[1].replace(/\s+of$/i, '').trim(), name: m[2].trim() }
  return { amount: '', name: text }
}

export function parseIngredients(text) {
  return text
    .split('\n')
    .map(parseIngredient)
    .filter(Boolean)
}

export function ingredientsToText(ingredients) {
  return ingredients.map((i) => (i.amount ? `${i.amount} ${i.name}` : i.name)).join('\n')
}

const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 }

function parseNumber(text) {
  let total = 0
  for (const part of text.trim().split(/\s+/)) {
    if (FRACTIONS[part] != null) total += FRACTIONS[part]
    else if (/^\d+\/\d+$/.test(part)) {
      const [a, b] = part.split('/').map(Number)
      if (!b) return null
      total += a / b
    } else if (/^\d+(?:[.,]\d+)?$/.test(part)) total += Number(part.replace(',', '.'))
    else return null
  }
  return total
}

function formatNumber(n) {
  const whole = Math.floor(n)
  const rest = n - whole
  const frac = Object.entries(FRACTIONS).find(([, v]) => Math.abs(v - rest) < 0.01)
  if (rest < 0.01) return String(whole)
  if (frac) return whole ? `${whole} ${frac[0]}` : frac[0]
  return String(Math.round(n * 100) / 100)
}

/**
 * Add up amounts that share a unit: ["1", "2", "1 cup", "½ cup"] → "3 + 1 ½ cup".
 * Amounts that can't be read as numbers are kept as they are.
 */
export function combineAmounts(amounts) {
  const byUnit = new Map()
  const other = []
  for (const amount of amounts) {
    const m = amount.match(/^([\d.,/½¼¾⅓⅔\s]+?)\s*([a-z]+\.?)?$/i)
    const n = m && parseNumber(m[1])
    if (n == null) {
      other.push(amount)
      continue
    }
    const unit = (m[2] || '').replace(/\.$/, '')
    const key = unit.toLowerCase().replace(/(?<=..)(es|s)$/, '')
    const entry = byUnit.get(key) || { total: 0, unit }
    entry.total += n
    byUnit.set(key, entry)
  }
  const parts = [...byUnit.values()].map(({ total, unit }) => {
    const num = formatNumber(total)
    if (!unit) return num
    // "3 can" → "3 cans"; keep abbreviations like lb and g as they are.
    const plural = total > 1 && /^(can|jar|pack|package|bag|box|clove|head|slice|stick|cup|handful|bunch|pinch)$/i.test(unit)
    return `${num}${/^(g|kg|ml|l|oz)$/i.test(unit) ? '' : ' '}${plural ? unit.replace(/(ch)?$/, (x) => (x ? 'ches' : 's')) : unit}`
  })
  return [...parts, ...other].join(' + ')
}

/** Key used to combine the same ingredient across recipes ("Onions" and "onion"). */
export function groceryKey(name) {
  let n = name.toLowerCase().replace(/\(.*?\)/g, '').replace(/,.*$/, '').replace(/\s+/g, ' ').trim()
  if (n.endsWith('oes')) n = n.slice(0, -2)
  else if (n.endsWith('ies') && n.length > 4) n = `${n.slice(0, -3)}y`
  else if (n.endsWith('s') && !n.endsWith('ss') && n.length > 3) n = n.slice(0, -1)
  return n
}

export function planDays(today) {
  return rangeKeys(today, addDays(today, PLAN_DAYS - 1))
}

export function plannedMeals(state, today) {
  const out = []
  for (const day of planDays(today)) {
    for (const slot of MEAL_SLOTS) {
      const recipeId = state.mealPlan?.[day]?.[slot.id]
      const recipe = recipeId && state.recipes.find((r) => r.id === recipeId)
      if (recipe) out.push({ day, slot: slot.id, recipe })
    }
  }
  return out
}

/** Minutes of cooking planned per day, so the scheduler can plan around it. */
export function cookingMinutesByDay(state) {
  const out = {}
  for (const [day, slots] of Object.entries(state.mealPlan || {})) {
    for (const recipeId of Object.values(slots)) {
      const recipe = state.recipes?.find((r) => r.id === recipeId)
      if (recipe?.minutes) out[day] = (out[day] || 0) + recipe.minutes
    }
  }
  return out
}

// A check-off only counts for a week, so next week's tacos need onions again.
const CHECK_LIFETIME_DAYS = 7

export function activeCheck(state, key, today) {
  const check = state.groceries?.checks?.[key]
  if (!check) return null
  return check.date > addDays(today, -CHECK_LIFETIME_DAYS) ? check.status : null
}

/**
 * The grocery list for the next week of planned meals.
 * Items are combined by ingredient; each remembers which meals need it and
 * the earliest day it's needed.
 */
export function groceryList(state, today) {
  const items = new Map()
  for (const { day, recipe } of plannedMeals(state, today)) {
    for (const ing of recipe.ingredients || []) {
      const key = groceryKey(ing.name)
      if (!key) continue
      let item = items.get(key)
      if (!item) {
        item = { key, name: ing.name, amounts: [], recipes: [], firstDay: day }
        items.set(key, item)
      }
      if (ing.amount) item.amounts.push(ing.amount)
      if (!item.recipes.includes(recipe.name)) item.recipes.push(recipe.name)
      if (day < item.firstDay) item.firstDay = day
    }
  }
  for (const extra of state.groceries?.extras || []) {
    const key = `extra:${extra.id}`
    items.set(key, { key, name: extra.name, amounts: [], recipes: [], firstDay: null, extraId: extra.id })
  }
  return [...items.values()]
    .map((item) => ({ ...item, status: activeCheck(state, item.key, today) }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

// Rough share of a day's calories each planned meal aims for; breakfast and
// snacks make up the rest.
const MEAL_SHARE = { lunch: 0.35, dinner: 0.4 }

export function nutritionOn(state) {
  return !!state.settings?.nutrition
}

/** Planned calories per day, counting only recipes that have calories set. */
export function plannedCalories(state, day) {
  let total = 0
  let known = false
  for (const id of Object.values(state.mealPlan?.[day] || {})) {
    const cal = state.recipes.find((r) => r.id === id)?.calories
    if (cal) {
      total += cal
      known = true
    }
  }
  return known ? total : null
}

/**
 * Fill empty slots in the coming week. Dinners always; lunches only if the
 * user has lunch recipes (plenty of people don't plan lunch). Rotates through
 * recipes, least recently planned first, and avoids repeats within the week.
 * With nutrition on and a daily target set, it also prefers recipes that
 * bring the day's planned meals close to their share of the target.
 */
export function suggestMeals(state, today) {
  const days = planDays(today)
  const plan = structuredClone(state.mealPlan || {})
  const lastUsed = {}
  for (const [day, slots] of Object.entries(plan)) {
    for (const id of Object.values(slots)) if (id && (!lastUsed[id] || day > lastUsed[id])) lastUsed[id] = day
  }
  const planLunch = state.recipes.some((r) => r.meal === 'lunch')
  const usedThisWeek = new Set(days.flatMap((d) => Object.values(plan[d] || {})).filter(Boolean))

  for (const day of days) {
    for (const slot of ['lunch', 'dinner']) {
      if (slot === 'lunch' && !planLunch) continue
      if (plan[day]?.[slot]) continue
      const fits = state.recipes.filter((r) => r.meal === slot || r.meal === 'any' || !r.meal)
      if (!fits.length) continue
      const fresh = fits.filter((r) => !usedThisWeek.has(r.id))
      const pool = fresh.length ? fresh : fits
      const byRotation = [...pool].sort(
        (a, b) => (lastUsed[a.id] || '').localeCompare(lastUsed[b.id] || '') || a.createdAt - b.createdAt,
      )
      let pick = byRotation[0]
      const target = nutritionOn(state) && Number(state.settings.calorieTarget)
      if (target) {
        const other = slot === 'lunch' ? 'dinner' : 'lunch'
        const otherCal = state.recipes.find((r) => r.id === plan[day]?.[other])?.calories
        const ideal = otherCal
          ? target * (MEAL_SHARE.lunch + MEAL_SHARE.dinner) - otherCal
          : target * MEAL_SHARE[slot]
        // Variety still matters: a recipe eaten in the last few days costs as much as
        // being a few hundred calories off target, so the week doesn't repeat one dish.
        const recency = (r) => (lastUsed[r.id] ? Math.max(0, 4 - diffDays(lastUsed[r.id], day)) * 1.5 : 0)
        const cost = (r, i) => recency(r) + (r.calories ? Math.abs(r.calories - ideal) / 150 : 2) + i * 0.01
        pick = byRotation.map((r, i) => ({ r, c: cost(r, i) })).sort((a, b) => a.c - b.c)[0].r
      }
      plan[day] = { ...(plan[day] || {}), [slot]: pick.id }
      usedThisWeek.add(pick.id)
      lastUsed[pick.id] = day
    }
  }
  return plan
}
