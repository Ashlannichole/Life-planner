import { useState } from 'react'
import { WEEKDAY_SHORT, formatMinutes, timeToMinutes } from '../lib/dates.js'
import { uid } from '../lib/model.js'
import { useStore } from '../store.jsx'
import { Sheet, useToast } from './ui.jsx'

// Monday-first so it reads like a week.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function BlockRows({ blocks, onChange }) {
  const setBlock = (id, fields) => onChange(blocks.map((b) => (b.id === id ? { ...b, ...fields } : b)))
  return (
    <div className="stack" style={{ gap: 8 }}>
      {blocks.map((b) => (
        <div key={b.id} className="block-row">
          <div className="day-chips">
            {DAY_ORDER.map((d) => (
              <button
                key={d}
                type="button"
                className={b.days.includes(d) ? 'on' : ''}
                aria-pressed={b.days.includes(d)}
                onClick={() => setBlock(b.id, { days: b.days.includes(d) ? b.days.filter((x) => x !== d) : [...b.days, d] })}
              >
                {WEEKDAY_SHORT[d].slice(0, 2)}
              </button>
            ))}
          </div>
          <div className="time-range">
            <input className="input" type="time" value={b.start} onChange={(e) => setBlock(b.id, { start: e.target.value })} aria-label="From" />
            <span className="muted">to</span>
            <input className="input" type="time" value={b.end} onChange={(e) => setBlock(b.id, { end: e.target.value })} aria-label="Until" />
            <button type="button" className="icon-btn" aria-label="Remove block" onClick={() => onChange(blocks.filter((x) => x.id !== b.id))}>
              ×
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn"
        onClick={() => onChange([...blocks, { id: uid(), days: [6], start: '10:00', end: '12:00' }])}
      >
        + Add free time
      </button>
    </div>
  )
}

export function weeklyFreeMinutes(blocks) {
  return blocks.reduce((t, b) => t + Math.max(0, timeToMinutes(b.end) - timeToMinutes(b.start)) * b.days.length, 0)
}

export default function TemplateEditor({ template, onClose }) {
  const { state, actions } = useStore()
  const toast = useToast()
  const [draft, setDraft] = useState(() => structuredClone(template))
  const isActive = state.activeTemplateId === template.id
  const exists = state.templates.some((t) => t.id === template.id)

  return (
    <Sheet title={exists ? 'Edit free time' : 'New schedule'} onClose={onClose}>
      <div className="stack">
        <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="Schedule name" placeholder="e.g. Normal, Club season" />
        <p className="small muted" style={{ margin: 0 }}>
          When are you usually free to do things? About {formatMinutes(weeklyFreeMinutes(draft.blocks))} a week. Changes apply from today onward.
        </p>
        <BlockRows blocks={draft.blocks} onChange={(blocks) => setDraft({ ...draft, blocks })} />
        <button
          className="btn primary big"
          onClick={() => {
            actions.saveTemplate({ ...draft, name: draft.name.trim() || 'Schedule' })
            toast('Saved — plan rebalanced')
            onClose()
          }}
        >
          Save
        </button>
        {exists && !isActive && (
          <button className="btn" onClick={() => actions.setActiveTemplate(template.id)}>
            Use this schedule
          </button>
        )}
        {exists && state.templates.length > 1 && (
          <button
            className="btn ghost danger"
            onClick={() => {
              actions.deleteTemplate(template.id)
              onClose()
            }}
          >
            Delete schedule
          </button>
        )}
      </div>
    </Sheet>
  )
}
