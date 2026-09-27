import { describe, expect, it } from 'vitest'
import { addDays } from './dates.js'
import { groceryKey, groceryList, parseIngredient, suggestMeals } from './meals.js'
import { initialState, makeTask, makeTemplate } from './model.js'
import { buildSchedule } from './scheduler.js'

const MON = '2026-09-28'
const recipe = (id, name, ingredients, fields = {}) => ({
  id,
  name,
  meal: 'dinner',
  minutes: 30,
  createdAt: id.charCodeAt(0),
  ingredients: ingredients.map((l) => parseIngredient(l)),
  ...fields,
})

describe('parseIngredient', () => {
  it('splits amounts and units from the name', () => {
    expect(parseIngredient('2 onions')).toEqual({ amount: '2', name: 'onions' })
    expect(parseIngredient('1 1/2 cups rice')).toEqual({ amount: '1 1/2 cups', name: 'rice' })
    expect(parseIngredient('- 400g can of tomatoes')).toEqual({ amount: '400g', name: 'can of tomatoes' })
    expect(parseIngredient('2 cans of black beans')).toEqual({ amount: '2 cans', name: 'black beans' })
    expect(parseIngredient('salt')).toEqual({ amount: '', name: 'salt' })
    expect(parseIngredient('   ')).toBeNull()
  })

  it('combines singular and plural names', () => {
    expect(groceryKey('Onions')).toBe(groceryKey('onion'))
    expect(groceryKey('tomatoes')).toBe(groceryKey('tomato'))
    expect(groceryKey('berries')).toBe(groceryKey('berry'))
    expect(groceryKey('garlic, minced')).toBe('garlic')
    expect(groceryKey('grass')).toBe('grass')
  })
})

describe('groceryList', () => {
  const tacos = recipe('t', 'Tacos', ['1 lb ground beef', '1 onion', 'tortillas'])
  const soup = recipe('s', 'Soup', ['2 onions', '1 carrot'])

  it('combines ingredients across planned meals', () => {
    const state = {
      ...initialState(),
      recipes: [tacos, soup],
      mealPlan: { [MON]: { dinner: 't' }, [addDays(MON, 2)]: { dinner: 's' } },
    }
    const list = groceryList(state, MON)
    const onion = list.find((i) => i.key === 'onion')
    expect(onion.amounts).toEqual(['1', '2'])
    expect(onion.recipes).toEqual(['Tacos', 'Soup'])
    expect(onion.firstDay).toBe(MON)
    expect(list).toHaveLength(4)
  })

  it('ignores meals outside the coming week and expires old check-offs', () => {
    const state = {
      ...initialState(),
      recipes: [tacos],
      mealPlan: { [addDays(MON, -1)]: { dinner: 't' }, [addDays(MON, 3)]: { dinner: 't' } },
      groceries: {
        checks: { onion: { status: 'got', date: MON }, tortilla: { status: 'have', date: addDays(MON, -10) } },
        extras: [{ id: 'x', name: 'Coffee' }],
      },
    }
    const list = groceryList(state, MON)
    expect(list.find((i) => i.key === 'onion').status).toBe('got')
    expect(list.find((i) => i.key === 'tortilla').status).toBeNull()
    expect(list.some((i) => i.name === 'Coffee')).toBe(true)
  })
})

describe('suggestMeals', () => {
  it('fills empty dinners without repeating while there are fresh recipes', () => {
    const recipes = ['a', 'b', 'c'].map((id) => recipe(id, id, []))
    const state = { ...initialState(), recipes, mealPlan: { [MON]: { dinner: 'b' } } }
    const plan = suggestMeals(state, MON)
    const week = Array.from({ length: 7 }, (_, i) => plan[addDays(MON, i)]?.dinner)
    expect(week.every(Boolean)).toBe(true)
    expect(week[0]).toBe('b')
    expect(new Set(week.slice(0, 3)).size).toBe(3)
    // No lunch recipes means lunches stay unplanned.
    expect(Object.values(plan).some((d) => d.lunch)).toBe(false)
  })

  it('plans lunches only with lunch recipes', () => {
    const recipes = [recipe('d', 'Pasta', []), recipe('l', 'Salad', [], { meal: 'lunch' })]
    const plan = suggestMeals({ ...initialState(), recipes, mealPlan: {} }, MON)
    expect(plan[MON]).toEqual({ lunch: 'l', dinner: 'd' })
  })
})

describe('cooking time in the schedule', () => {
  it('leaves less room for tasks on days with a planned meal', () => {
    const template = makeTemplate('T', [{ days: [0, 1, 2, 3, 4, 5, 6], start: '18:00', end: '21:00' }])
    const tasks = Array.from({ length: 6 }, (_, i) => makeTask({ title: `T${i}`, minutes: 30, createdAt: i }))
    const base = { ...initialState(), templates: [template], activeTemplateId: template.id, tasks }
    const withMeal = {
      ...base,
      recipes: [recipe('p', 'Pasta', [], { minutes: 60 })],
      mealPlan: { [MON]: { dinner: 'p' } },
    }
    const plain = buildSchedule(base, { today: MON }).days[0]
    const cooking = buildSchedule(withMeal, { today: MON }).days[0]
    expect(cooking.cookingMinutes).toBe(60)
    expect(cooking.planned).toBeLessThan(plain.planned)
    expect(cooking.planned + 60).toBeLessThanOrEqual(cooking.capacity)
  })
})

describe('combineAmounts', () => {
  it('adds up amounts that share a unit', async () => {
    const { combineAmounts } = await import('./meals.js')
    expect(combineAmounts(['1', '2', '1', '2', '1'])).toBe('7')
    expect(combineAmounts(['1 lb', '1 lb', '1 lb'])).toBe('3 lb')
    expect(combineAmounts(['1 cup', '½ cup'])).toBe('1 ½ cups')
    expect(combineAmounts(['2', '1 can', '1 can'])).toBe('2 + 2 cans')
    expect(combineAmounts(['200g', '200g'])).toBe('400g')
    expect(combineAmounts(['1 1/2 cups', '1/2 cup'])).toBe('2 cups')
    expect(combineAmounts(['a handful', '2'])).toBe('2 + a handful')
  })
})
