// What the phone's home-screen widget shows: the next few things on today's plan, how many
// are done, and the plant. Tomorrow's version goes along too, so the widget can switch over
// at midnight without the app being opened.

import { BLOOM_AT, plantType, stageIndex } from './plant.js'

// The plant as one emoji, by stage; full bloom shows its own kind of flower.
const STAGE_EMOJI = ['🌰', '🌱', '🌿', '🪴', '🌷']
const BLOOM_EMOJI = { sunflower: '🌻', tulip: '🌷', rose: '🌹', cherry: '🌸', 'xmas-tree': '🎄', 'bat-flower': '🦇', shamrock: '☘️', hibiscus: '🌺', holly: '🎄' }

export function plantEmoji(current) {
  const stage = stageIndex(current.water)
  if (stage < STAGE_EMOJI.length) return STAGE_EMOJI[stage]
  return BLOOM_EMOJI[current.typeId] || '🌼'
}

function dayCard(day, done, plant) {
  if (!day) return null
  return {
    day: day.key,
    next: day.items.slice(0, 6).map((i) => ({ title: i.title, minutes: i.minutes || 0 })),
    left: day.items.length,
    done,
    bedDay: !!day.bedDay,
    plant,
  }
}

export function widgetData(state, schedule, today) {
  const current = state.plant.current
  const plant = plantEmoji(current)
  const done = state.completions.filter((c) => c.date === today).length
  const [first, second] = schedule.days
  return {
    today: dayCard(first?.key === today ? first : null, done, plant) || { day: today, next: [], left: 0, done, plant },
    tomorrow: dayCard(second, 0, plant),
    plantName: plantType(current.typeId).name,
    toBloom: Math.max(0, BLOOM_AT - current.water),
  }
}
