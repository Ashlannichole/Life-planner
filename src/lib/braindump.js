// Plus: brain dump. Type (or paste) everything on your mind in one go; each line
// becomes a task, with days and times picked out of the words.

import { addDays, weekday } from './dates.js'
import { guessFromTitle } from './model.js'

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const DAY_WORD = '(today|tonight|tomorrow|tmrw|sun(?:day)?|mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:rs|rsday)?|fri(?:day)?|sat(?:urday)?)'
const BY_DAY = new RegExp(`\\s*\\b(?:by|before|due)\\s+${DAY_WORD}\\b`, 'i')
const ON_DAY = new RegExp(`\\s*\\b(?:on\\s+)?${DAY_WORD}\\b`, 'i')
const MINUTES = /\s*\(?\b(\d+(?:\.\d+)?)\s*(m|min|mins|minutes|h|hr|hrs|hour|hours)\b\)?/i

/** The day a word like "friday" or "tomorrow" means, counting from today. */
export function dayFromWord(word, today) {
  const w = word.toLowerCase()
  if (w === 'today' || w === 'tonight') return today
  if (w === 'tomorrow' || w === 'tmrw') return addDays(today, 1)
  const target = DAYS.indexOf(w.slice(0, 3))
  if (target < 0) return null
  return addDays(today, (target - weekday(today) + 7) % 7)
}

/** Split a dump into items: one per line, or by commas when it's all one line. */
export function splitDump(text) {
  const lines = text.split(/\r?\n/)
  const parts = lines.length === 1 ? lines[0].split(/[,;]|\s+and then\s+/i) : lines
  return parts
    .map((l) =>
      l
        .replace(/^\s*(?:[-*•·]|\d+[.)]|\[\s?[xX]?\s?\])\s*/, '')
        .trim()
        .replace(/[.!]+$/, ''),
    )
    .filter(Boolean)
}

/** One line → task fields: { title, onDate?, deadline?, minutes?, type, category }. */
export function parseItem(line, today) {
  let title = line
  const fields = {}
  const by = title.match(BY_DAY)
  if (by) {
    fields.deadline = dayFromWord(by[1], today)
    title = title.replace(BY_DAY, '')
  } else {
    const on = title.match(ON_DAY)
    if (on) {
      fields.onDate = dayFromWord(on[1], today)
      title = title.replace(ON_DAY, '')
    }
  }
  const mins = title.match(MINUTES)
  if (mins) {
    const n = parseFloat(mins[1])
    const minutes = /^h/i.test(mins[2]) ? n * 60 : n
    fields.minutes = Math.min(240, Math.max(5, Math.round(minutes / 5) * 5))
    title = title.replace(MINUTES, '')
  }
  title = title.replace(/\s{2,}/g, ' ').trim()
  title = title.charAt(0).toUpperCase() + title.slice(1)
  return { title, ...guessFromTitle(title), ...fields }
}

export function parseDump(text, today) {
  return splitDump(text)
    .map((line) => parseItem(line, today))
    .filter((item) => item.title)
}
