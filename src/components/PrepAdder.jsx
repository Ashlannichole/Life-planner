import { useState } from 'react'
import { guessFromTitle } from '../lib/model.js'
import { PREP_WHEN, prepSuggestions } from '../lib/prep.js'
import { Toggle } from './ui.jsx'

/**
 * Add extra prep tasks to an event: one-tap suggestions for trips, or type
 * your own and pick "when" in plain words. Length defaults to 30 minutes so
 * there's nothing else to decide.
 *
 * `templateName` turns on "Add to every future …", which saves the new items
 * into that prep template too.
 */
export default function PrepAdder({ isTrip, existingTitles, templateName, onAdd }) {
  const [text, setText] = useState('')
  const [daysBefore, setDaysBefore] = useState(3)
  const [remember, setRemember] = useState(false)
  const suggestions = prepSuggestions(isTrip, existingTitles)

  // Not a <form>: this sits inside the event editor's form.
  const add = () => {
    const title = text.trim()
    if (!title) return
    onAdd([{ title, daysBefore, minutes: 30, category: guessFromTitle(title).category || null }], remember)
    setText('')
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <span className="label">Add more prep</span>
      {suggestions.length > 0 && (
        <div className="chips">
          {suggestions.map((s) => (
            <button key={s.id} type="button" className="chip" onClick={() => onAdd([s], remember)}>
              + {s.title}
            </button>
          ))}
        </div>
      )}
      <div className="quick-add">
        <input
          placeholder="Something else to do first"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          aria-label="New prep task"
        />
        <button className="btn" type="button" onClick={add} disabled={!text.trim()}>
          Add
        </button>
      </div>
      <div className="chips" role="radiogroup" aria-label="When">
        {PREP_WHEN.map((w) => (
          <button
            key={w.daysBefore}
            type="button"
            role="radio"
            aria-checked={daysBefore === w.daysBefore}
            className={`chip ${daysBefore === w.daysBefore ? 'on' : ''}`}
            onClick={() => setDaysBefore(w.daysBefore)}
          >
            {w.label}
          </button>
        ))}
      </div>
      {templateName && (
        <div className="row spread small">
          <span>Add to every future {templateName.toLowerCase()}</span>
          <Toggle on={remember} onChange={setRemember} label={`Add to every future ${templateName}`} />
        </div>
      )}
    </div>
  )
}
