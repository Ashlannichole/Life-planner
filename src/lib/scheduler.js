// Rule-based scheduler.
//
// The schedule is never stored. It is recomputed from tasks, the active
// schedule template, events and a few user overrides (pins, deferrals, manual
// order) every time something changes. Because only today and later days are
// planned, unfinished tasks from earlier days simply flow into the next day
// with room — rollover without any penalty or "overdue" state.

import { addDays, addMonths, diffDays, isWeekend, rangeKeys, timeToMinutes, weekday } from './dates.js'
import { cookingMinutesByDay } from './meals.js'
import { PARTS } from './model.js'

export const HORIZON_DAYS = 14

// A low-energy day keeps this share of its usual plan.
export const LOW_ENERGY_FACTOR = 0.6

// ---------------------------------------------------------------------------
// Recurrence

export function nextDue(task, fromKey) {
  switch (task.repeat) {
    case 'daily':
      return addDays(fromKey, 1)
    case 'weekly':
      return addDays(fromKey, 7)
    case 'everyX':
      return addDays(fromKey, Math.max(1, Number(task.everyDays) || 1))
    case 'monthly':
      return addMonths(fromKey, 1)
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Availability

export function eventsOnDay(events, key) {
  return events.filter((e) => e.date <= key && key <= (e.endDate || e.date))
}

function eventBusy(ev, key) {
  if (ev.allDay) return [[0, 1440]]
  const end = ev.endDate || ev.date
  const s = key === ev.date ? timeToMinutes(ev.start || '00:00') : 0
  let e = key === end ? timeToMinutes(ev.end || '23:59') : 1440
  if (e <= s) e = key === ev.date && key === end ? s : 1440
  return e > s ? [[s, e]] : []
}

function mergeIntervals(list) {
  const sorted = [...list].sort((a, b) => a[0] - b[0])
  const out = []
  for (const [s, e] of sorted) {
    const last = out[out.length - 1]
    if (last && s <= last[1]) last[1] = Math.max(last[1], e)
    else out.push([s, e])
  }
  return out
}

function subtractIntervals(free, busy) {
  let result = free
  for (const [bs, be] of busy) {
    const next = []
    for (const [fs, fe] of result) {
      if (be <= fs || bs >= fe) next.push([fs, fe])
      else {
        if (bs > fs) next.push([fs, bs])
        if (be < fe) next.push([be, fe])
      }
    }
    result = next
  }
  return result
}

const sumIntervals = (list) => list.reduce((t, [s, e]) => t + (e - s), 0)

function overlap([s, e], from, to) {
  return Math.max(0, Math.min(e, to) - Math.max(s, from))
}

export function dayAvailability(template, events, key, buffer = 0.2) {
  const wd = weekday(key)
  const blocks = (template?.blocks || [])
    .filter((b) => b.days.includes(wd))
    .map((b) => [timeToMinutes(b.start), timeToMinutes(b.end)])
    .filter(([s, e]) => e > s)
  const dayEvents = eventsOnDay(events, key)
  const busy = mergeIntervals(dayEvents.flatMap((e) => eventBusy(e, key)))
  const free = subtractIntervals(mergeIntervals(blocks), busy)
  const freeMinutes = sumIntervals(free)
  const eventMinutes = sumIntervals(busy)
  const allDayBusy = eventMinutes >= 1440

  // Busy days get a lighter plan: every hour of events trims the plan further.
  const busyFactor = allDayBusy ? 0 : Math.min(1, Math.max(0.5, 1 - eventMinutes / 600))
  const factor = (1 - buffer) * busyFactor
  const parts = {}
  for (const p of PARTS) {
    parts[p.id] = Math.floor(free.reduce((t, iv) => t + overlap(iv, p.from, p.to), 0) * factor)
  }
  return {
    free,
    freeMinutes,
    eventMinutes,
    allDayBusy,
    capacity: Math.floor(freeMinutes * factor),
    parts,
    events: dayEvents,
  }
}

// ---------------------------------------------------------------------------
// Occurrences: the concrete "things to do" generated from tasks

export function buildOccurrences(state, today, lastDay) {
  const byTask = {}
  for (const c of state.completions) {
    ;(byTask[c.taskId] ||= []).push(c)
  }
  const occs = []
  for (const task of state.tasks) {
    const base = {
      taskId: task.id,
      title: task.title,
      type: task.type,
      minutes: task.minutes,
      category: task.category,
      preferredTime: task.preferredTime,
      eventId: task.eventId,
      createdAt: task.createdAt,
      repeat: task.repeat,
    }
    if (!task.repeat || task.repeat === 'none') {
      if (task.doneAt) continue
      let earliest = today
      if (task.notBefore && task.notBefore > earliest) earliest = task.notBefore
      occs.push({
        ...base,
        key: task.id,
        earliest,
        deadline: task.deadline || null,
        kind: task.deadline ? 'deadline' : 'flex',
      })
      continue
    }
    const comps = byTask[task.id] || []
    const lastDone = comps.reduce((m, c) => (c.date > m ? c.date : m), '')
    let due = lastDone ? nextDue(task, lastDone) : task.startDate || today
    // Missed repeats are not stacked up: only the current one is kept.
    if (due < today) due = today
    for (let i = 0; due <= lastDay && i < 60; i++) {
      const next = nextDue(task, due)
      occs.push({
        ...base,
        key: `${task.id}:${comps.length + i}`,
        earliest: due,
        latest: addDays(next, -1),
        due,
        kind: 'recurring',
      })
      due = next
    }
  }
  for (const o of occs) {
    const deferred = state.deferrals?.[o.key]
    if (deferred && deferred > o.earliest) o.earliest = deferred
  }
  return occs
}

// ---------------------------------------------------------------------------
// Placement

const PART_ORDER = { morning: 0, afternoon: 1, evening: 2 }

function roomIn(day, part) {
  return day.parts[part] - day.partUsed[part]
}

function choosePart(day, occ) {
  const pref = occ.preferredTime
  if (pref && pref !== 'weekend' && roomIn(day, pref) >= occ.minutes) return pref
  let best = null
  for (const p of PARTS) {
    if (day.parts[p.id] <= 0) continue
    if (!best || roomIn(day, p.id) > roomIn(day, best)) best = p.id
  }
  return best || (pref && pref !== 'weekend' ? pref : 'evening')
}

function fits(day, occ) {
  if (day.taskIds.has(occ.taskId)) return false
  if (day.capacity <= 0) return false
  if (occ.minutes <= day.capacity - day.used) return true
  // A long task can still go on an otherwise empty day with most of the room it needs.
  return day.used === 0 && day.capacity >= occ.minutes * 0.6
}

function score(day, occ) {
  let s = day.index * 1.5
  s += ((day.used + occ.minutes) / Math.max(day.capacity, 1)) * 4
  if (occ.category) s += (day.cats[occ.category] || 0) * 4
  const pref = occ.preferredTime
  if (pref === 'weekend') s += day.weekend ? -6 : 4
  else if (pref) s += roomIn(day, pref) >= occ.minutes ? -3 : 2
  if (occ.due) s += Math.max(0, diffDays(occ.due, day.key)) * 2
  return s
}

function bestDay(days, occ) {
  // "Weekend" is a strong preference: only fall back to weekdays when no weekend day fits.
  if (occ.preferredTime === 'weekend') {
    const weekend = pickBest(days.filter((d) => d.weekend), occ)
    if (weekend) return weekend
  }
  return pickBest(days, occ)
}

function pickBest(days, occ) {
  let best = null
  let bestScore = Infinity
  for (const day of days) {
    if (!fits(day, occ)) continue
    const s = score(day, occ)
    if (s < bestScore) {
      best = day
      bestScore = s
    }
  }
  return best
}

function place(day, occ, reason) {
  const part = choosePart(day, occ)
  day.items.push({ ...occ, day: day.key, part, reason })
  day.used += occ.minutes
  if (day.partUsed[part] !== undefined) day.partUsed[part] += occ.minutes
  if (occ.category) day.cats[occ.category] = (day.cats[occ.category] || 0) + 1
  day.taskIds.add(occ.taskId)
  if (occ.type === 'want') day.hasWant = true
}

// Suggested order inside a day: grouped by part of day, starting with a quick
// warm-up task, then alternating need-to and want-to so fun stays in the mix.
function suggestedOrder(items) {
  const out = []
  for (const part of ['morning', 'afternoon', 'evening']) {
    const group = items.filter((i) => (i.part || 'evening') === part)
    const needs = group
      .filter((i) => i.type !== 'want')
      .sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999') || a.minutes - b.minutes)
    const wants = group.filter((i) => i.type === 'want').sort((a, b) => a.minutes - b.minutes)
    const quick = needs.findIndex((n) => n.minutes <= 15)
    if (quick > 0) needs.unshift(needs.splice(quick, 1)[0])
    while (needs.length || wants.length) {
      if (needs.length) out.push(needs.shift())
      if (wants.length) out.push(wants.shift())
    }
  }
  return out
}

function applyManualOrder(items, order) {
  if (!order?.length) return items
  const idx = new Map(order.map((k, i) => [k, i]))
  return items
    .map((item, i) => ({ item, rank: idx.has(item.key) ? idx.get(item.key) : order.length + i }))
    .sort((a, b) => a.rank - b.rank)
    .map((x) => x.item)
}

export function buildSchedule(state, { today, horizon = HORIZON_DAYS }) {
  const lastDay = addDays(today, horizon - 1)
  const template = state.templates.find((t) => t.id === state.activeTemplateId) || state.templates[0]
  const buffer = state.settings?.buffer ?? 0.2

  const days = rangeKeys(today, lastDay).map((key, index) => ({
    key,
    index,
    ...dayAvailability(template, state.events, key, buffer),
    used: 0,
    partUsed: { morning: 0, afternoon: 0, evening: 0 },
    items: [],
    cats: {},
    taskIds: new Set(),
    hasWant: false,
    weekend: isWeekend(key),
  }))
  const byKey = new Map(days.map((d) => [d.key, d]))

  // Low-energy days get a lighter plan. Set by the user today; later this can
  // come from a wearable's readiness score.
  for (const day of days) {
    if (state.energy?.[day.key] !== 'low') continue
    day.capacity = Math.floor(day.capacity * LOW_ENERGY_FACTOR)
    for (const p of Object.keys(day.parts)) day.parts[p] = Math.floor(day.parts[p] * LOW_ENERGY_FACTOR)
  }

  // Planned meals take cooking time, so those days get less other work.
  const cooking = cookingMinutesByDay(state)
  for (const day of days) {
    const minutes = cooking[day.key] || 0
    if (!minutes) continue
    day.used += minutes
    day.cats.cooking = (day.cats.cooking || 0) + 1
  }

  // Work already done today uses up today's time.
  const doneToday = state.completions.filter((c) => c.date === today)
  const first = days[0]
  for (const c of doneToday) {
    first.used += c.minutes
    first.taskIds.add(c.taskId)
    if (c.category) first.cats[c.category] = (first.cats[c.category] || 0) + 1
    if (c.type === 'want') first.hasWant = true
  }

  let pool = buildOccurrences(state, today, lastDay)
  const unscheduled = []
  const take = (pred) => {
    const picked = pool.filter(pred)
    pool = pool.filter((o) => !pred(o))
    return picked
  }

  // 1. The user's own moves always win.
  for (const occ of take((o) => state.pins?.[o.key] && state.pins[o.key] >= today)) {
    const day = byKey.get(state.pins[occ.key])
    if (day) place(day, occ, 'pinned')
    else unscheduled.push(occ)
  }

  // 2. Tasks with deadlines, earliest deadline first.
  const deadlines = take((o) => o.kind === 'deadline').sort((a, b) => a.deadline.localeCompare(b.deadline))
  for (const occ of deadlines) {
    const end = occ.deadline < today ? today : occ.deadline
    const window = days.filter((d) => d.key >= occ.earliest && d.key <= (end < occ.earliest ? occ.earliest : end))
    if (!window.length) {
      unscheduled.push(occ)
      continue
    }
    let day = bestDay(window, occ)
    if (!day) {
      // Nothing fits before the deadline: squeeze it into the roomiest day rather than drop it.
      const open = window.filter((d) => !d.taskIds.has(occ.taskId) && !d.allDayBusy)
      day = (open.length ? open : window).reduce((a, b) => (b.capacity - b.used > a.capacity - a.used ? b : a))
    }
    place(day, occ, 'deadline')
  }

  // 3. Recurring tasks, each within its own repeat window.
  const recurring = take((o) => o.kind === 'recurring').sort(
    (a, b) => a.earliest.localeCompare(b.earliest) || a.latest.localeCompare(b.latest),
  )
  for (const occ of recurring) {
    const window = days.filter((d) => d.key >= occ.earliest && d.key <= occ.latest)
    const day = bestDay(window, occ)
    if (day) place(day, occ, 'recurring')
    // A repeat that doesn't fit is simply skipped; the next one will come around.
  }

  // 4. Guarantee a want-to task on each day that has room for one.
  const flex = take(() => true).sort((a, b) => a.createdAt - b.createdAt)
  let wants = flex.filter((o) => o.type === 'want')
  let needs = flex.filter((o) => o.type !== 'want')
  for (const day of days) {
    if (day.hasWant || day.capacity - day.used <= 0) continue
    const candidates = wants.filter(
      (o) => o.earliest <= day.key && (o.preferredTime !== 'weekend' || day.weekend) && fits(day, o),
    )
    if (!candidates.length) continue
    const pick = candidates.reduce((a, b) => (score(day, b) < score(day, a) ? b : a))
    wants = wants.filter((o) => o !== pick)
    place(day, pick, 'fun')
  }

  // 5. Everything else, alternating need-to and want-to so fun isn't crowded out.
  while (needs.length || wants.length) {
    for (const list of [needs, wants]) {
      const occ = list.shift()
      if (!occ) continue
      const day = bestDay(
        days.filter((d) => d.key >= occ.earliest),
        occ,
      )
      if (day) place(day, occ, 'flex')
      else unscheduled.push(occ)
    }
  }

  const nextDayForTask = {}
  const result = days.map((d) => {
    const items = applyManualOrder(suggestedOrder(d.items), state.dayOrder?.[d.key])
    for (const item of items) {
      if (!nextDayForTask[item.taskId]) nextDayForTask[item.taskId] = d.key
    }
    return {
      key: d.key,
      items,
      events: d.events,
      capacity: d.capacity,
      freeMinutes: d.freeMinutes,
      used: d.used,
      cookingMinutes: cooking[d.key] || 0,
      lowEnergy: state.energy?.[d.key] === 'low',
      planned: items.reduce((t, i) => t + i.minutes, 0),
      allDayBusy: d.allDayBusy,
      eventMinutes: d.eventMinutes,
    }
  })

  return { days: result, unscheduled, nextDayForTask, today, lastDay }
}

export { PART_ORDER }
