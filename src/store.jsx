import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { addDays, todayKey } from './lib/dates.js'
import { initialState, makeTask, makeTemplate, uid } from './lib/model.js'
import { groceryList, suggestMeals } from './lib/meals.js'
import { unwater, water } from './lib/plant.js'
import { makePrepTasks, reschedulePrepTasks } from './lib/prep.js'
import { buildSchedule } from './lib/scheduler.js'
import { playChime, playCheck } from './lib/sound.js'
import { housekeep, loadState, migrate, saveState } from './lib/storage.js'

const StoreContext = createContext(null)

function useToday() {
  const [today, setToday] = useState(() => todayKey())
  useEffect(() => {
    // Pick up the new day if the app stays open past midnight.
    const check = () => setToday(todayKey())
    const id = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])
  return today
}

export function StoreProvider({ children }) {
  const today = useToday()
  const [state, setState] = useState(() => housekeep(loadState(), todayKey()))
  const stateRef = useRef(state)
  // Celebrations to show (stage ups, blooms, surprise rewards). Not persisted.
  const [celebrations, setCelebrations] = useState([])

  const commit = useCallback((next) => {
    stateRef.current = next
    setState(next)
    saveState(next)
  }, [])

  const update = useCallback((fn) => commit(fn(stateRef.current)), [commit])

  useEffect(() => {
    update((s) => housekeep(s, today))
  }, [today, update])

  const schedule = useMemo(() => buildSchedule(state, { today }), [state, today])
  // Read through a ref so `actions` stays stable while the schedule changes.
  const scheduleRef = useRef(schedule)
  scheduleRef.current = schedule

  const actions = useMemo(() => {
    const sound = (fn) => stateRef.current.settings.sound && fn()

    return {
      // ---- tasks
      addTask(fields) {
        const task = makeTask(fields)
        update((s) => ({ ...s, tasks: [...s.tasks, task] }))
        return task
      },
      updateTask(id, fields) {
        update((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...fields } : t)) }))
      },
      deleteTask(id) {
        update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }))
      },

      // ---- doing things
      complete(occ) {
        const s = stateRef.current
        const completion = {
          id: uid(),
          occKey: occ.key,
          taskId: occ.taskId,
          date: today,
          at: Date.now(),
          title: occ.title,
          type: occ.type,
          minutes: occ.minutes,
          category: occ.category,
          eventId: occ.eventId || null,
        }
        const { plant, events } = water(s.plant, today)
        const pins = { ...s.pins }
        delete pins[occ.key]
        commit({
          ...s,
          plant,
          pins,
          completions: [...s.completions, completion],
          tasks: s.tasks.map((t) => (t.id === occ.taskId && t.repeat === 'none' ? { ...t, doneAt: today } : t)),
        })
        sound(playCheck)
        const queue = []
        if (events.bloomed) queue.push({ kind: 'bloom', plant: events.bloomed })
        else if (events.stageUp) queue.push({ kind: 'stage', stage: events.stageUp, plant })
        if (events.reward) queue.push({ kind: 'reward', reward: events.reward })
        if (queue.length) {
          setTimeout(() => {
            sound(playChime)
            setCelebrations((c) => [...c, ...queue])
          }, 700)
        }
        return completion
      },
      uncomplete(completionId) {
        const s = stateRef.current
        const c = s.completions.find((x) => x.id === completionId)
        if (!c) return
        commit({
          ...s,
          plant: unwater(s.plant),
          completions: s.completions.filter((x) => x.id !== completionId),
          tasks: s.tasks.map((t) => (t.id === c.taskId && t.repeat === 'none' ? { ...t, doneAt: null } : t)),
        })
      },
      dismissCelebration() {
        setCelebrations((c) => c.slice(1))
      },

      // ---- moving things around
      moveToDay(occKey, dayKey) {
        update((s) => {
          const deferrals = { ...s.deferrals }
          delete deferrals[occKey]
          return { ...s, pins: { ...s.pins, [occKey]: dayKey }, deferrals }
        })
      },
      notToday(occKey) {
        update((s) => {
          const pins = { ...s.pins }
          delete pins[occKey]
          return { ...s, pins, deferrals: { ...s.deferrals, [occKey]: addDays(today, 1) } }
        })
      },
      setDayOrder(dayKey, keys) {
        update((s) => ({ ...s, dayOrder: { ...s.dayOrder, [dayKey]: keys } }))
      },
      laterToday(occKey) {
        const day = scheduleRef.current.days[0]
        const keys = day.items.map((i) => i.key).filter((k) => k !== occKey)
        update((s) => ({
          ...s,
          pins: { ...s.pins, [occKey]: today },
          dayOrder: { ...s.dayOrder, [today]: [...keys, occKey] },
        }))
      },
      replan() {
        update((s) => ({ ...s, pins: {}, deferrals: {}, dayOrder: {} }))
      },

      // ---- templates
      saveTemplate(template) {
        update((s) => {
          const exists = s.templates.some((t) => t.id === template.id)
          return {
            ...s,
            templates: exists ? s.templates.map((t) => (t.id === template.id ? template : t)) : [...s.templates, template],
          }
        })
      },
      newTemplate(name, blocks) {
        const t = makeTemplate(name, blocks)
        update((s) => ({ ...s, templates: [...s.templates, t] }))
        return t
      },
      deleteTemplate(id) {
        update((s) => {
          const templates = s.templates.filter((t) => t.id !== id)
          if (!templates.length) return s
          return {
            ...s,
            templates,
            activeTemplateId: s.activeTemplateId === id ? templates[0].id : s.activeTemplateId,
          }
        })
      },
      setActiveTemplate(id) {
        update((s) => ({ ...s, activeTemplateId: id }))
      },

      // ---- events
      addEvent(event, prepItems = [], packing = []) {
        const ev = { ...event, id: uid(), packing: packing.map((text) => ({ id: uid(), text, packed: false })) }
        const prepTasks = makePrepTasks(ev, prepItems)
        update((s) => ({ ...s, events: [...s.events, ev], tasks: [...s.tasks, ...prepTasks] }))
        return ev
      },
      updateEvent(id, fields) {
        update((s) => {
          const events = s.events.map((e) => (e.id === id ? { ...e, ...fields } : e))
          const ev = events.find((e) => e.id === id)
          return { ...s, events, tasks: reschedulePrepTasks(s.tasks, ev) }
        })
      },
      deleteEvent(id) {
        update((s) => ({
          ...s,
          events: s.events.filter((e) => e.id !== id),
          // Unfinished prep goes with the event; finished prep stays in the history.
          tasks: s.tasks.filter((t) => t.eventId !== id || t.doneAt),
        }))
      },
      addPrepTasks(event, items) {
        const prepTasks = makePrepTasks(event, items)
        update((s) => ({ ...s, tasks: [...s.tasks, ...prepTasks] }))
      },

      // ---- prep templates and packing lists
      savePrepTemplate(tpl) {
        update((s) => {
          const exists = s.prepTemplates.some((t) => t.id === tpl.id)
          return {
            ...s,
            prepTemplates: exists ? s.prepTemplates.map((t) => (t.id === tpl.id ? tpl : t)) : [...s.prepTemplates, tpl],
          }
        })
      },
      deletePrepTemplate(id) {
        update((s) => ({ ...s, prepTemplates: s.prepTemplates.filter((t) => t.id !== id) }))
      },
      savePackingList(name, items) {
        update((s) => ({ ...s, packingLists: [...s.packingLists, { id: uid(), name, items }] }))
      },
      deletePackingList(id) {
        update((s) => ({ ...s, packingLists: s.packingLists.filter((p) => p.id !== id) }))
      },

      // ---- meals
      saveRecipe(recipe) {
        update((s) => {
          const exists = s.recipes.some((r) => r.id === recipe.id)
          return {
            ...s,
            recipes: exists ? s.recipes.map((r) => (r.id === recipe.id ? recipe : r)) : [...s.recipes, recipe],
          }
        })
      },
      deleteRecipe(id) {
        update((s) => ({
          ...s,
          recipes: s.recipes.filter((r) => r.id !== id),
          mealPlan: Object.fromEntries(
            Object.entries(s.mealPlan).map(([day, slots]) => [
              day,
              Object.fromEntries(Object.entries(slots).filter(([, rid]) => rid !== id)),
            ]),
          ),
        }))
      },
      setMeal(day, slot, recipeId) {
        update((s) => ({ ...s, mealPlan: { ...s.mealPlan, [day]: { ...(s.mealPlan[day] || {}), [slot]: recipeId } } }))
      },
      suggestMeals() {
        update((s) => ({ ...s, mealPlan: suggestMeals(s, today) }))
      },
      setGroceryStatus(key, status) {
        update((s) => {
          const checks = { ...s.groceries.checks }
          if (status) checks[key] = { status, date: today }
          else delete checks[key]
          return { ...s, groceries: { ...s.groceries, checks } }
        })
      },
      addGroceryExtra(name) {
        update((s) => ({ ...s, groceries: { ...s.groceries, extras: [...s.groceries.extras, { id: uid(), name }] } }))
      },
      removeGroceryExtra(id) {
        update((s) => {
          const checks = { ...s.groceries.checks }
          delete checks[`extra:${id}`]
          return { ...s, groceries: { checks, extras: s.groceries.extras.filter((e) => e.id !== id) } }
        })
      },
      clearGroceries() {
        // Bought extras are done; everything else starts unchecked again.
        update((s) => ({
          ...s,
          groceries: {
            checks: {},
            extras: s.groceries.extras.filter((e) => s.groceries.checks[`extra:${e.id}`]?.status !== 'got'),
          },
        }))
      },
      /** Add (or move) one "Grocery shopping" task, due before the first meal that needs something. */
      planShoppingTrip() {
        const s = stateRef.current
        const needed = groceryList(s, today).filter((i) => !i.status)
        if (!needed.length) return null
        const firstDay = needed.map((i) => i.firstDay).filter(Boolean).sort()[0]
        const deadline = firstDay && firstDay > today ? addDays(firstDay, -1) : today
        const existing = s.tasks.find((t) => t.groceryTrip && !t.doneAt)
        if (existing) {
          commit({ ...s, tasks: s.tasks.map((t) => (t === existing ? { ...t, deadline } : t)) })
          return existing.id
        }
        const task = makeTask({
          title: 'Grocery shopping',
          type: 'need',
          minutes: 60,
          category: 'errands',
          deadline,
          groceryTrip: true,
        })
        commit({ ...s, tasks: [...s.tasks, task] })
        return task.id
      },

      // ---- plant
      choosePlant(typeId, potId) {
        update((s) => ({
          ...s,
          plant: {
            ...s.plant,
            current: { ...s.plant.current, typeId, potId: potId || s.plant.current.potId, needsPick: false },
          },
        }))
      },
      choosePot(potId) {
        update((s) => ({ ...s, plant: { ...s.plant, current: { ...s.plant.current, potId } } }))
      },

      // ---- settings & data
      updateSettings(fields) {
        update((s) => ({ ...s, settings: { ...s.settings, ...fields } }))
      },
      finishOnboarding(fields = {}) {
        update((s) => ({ ...s, ...fields, onboarded: true }))
      },
      restartOnboarding() {
        update((s) => ({ ...s, onboarded: false }))
      },
      importData(data) {
        commit(housekeep(migrate(data), today))
      },
      resetAll() {
        commit(initialState())
      },
    }
  }, [commit, update, today])

  const value = useMemo(
    () => ({ state, schedule, today, actions, celebrations }),
    [state, schedule, today, actions, celebrations],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}
