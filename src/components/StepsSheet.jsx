import { useState } from 'react'
import { makeSteps, suggestSteps } from '../lib/steps.js'
import { useStore } from '../store.jsx'
import { Sheet, useToast } from './ui.jsx'

/** Plus: break a task into tiny steps. Starts from suggestions; every step can be changed. */
export default function StepsSheet({ task, onClose }) {
  const { actions } = useStore()
  const toast = useToast()
  const [titles, setTitles] = useState(() => (task.steps?.length ? task.steps.map((s) => s.title) : suggestSteps(task.title)))
  const [adding, setAdding] = useState('')

  const setAt = (i, value) => setTitles((list) => list.map((t, j) => (j === i ? value : t)))
  const removeAt = (i) => setTitles((list) => list.filter((_, j) => j !== i))

  const save = () => {
    const kept = new Map((task.steps || []).map((s) => [s.title, s]))
    // Keep the ticks on steps that didn't change.
    const steps = makeSteps(titles).map((s) => kept.get(s.title) || s)
    actions.setSteps(task.id, steps)
    toast(steps.length ? `✂️ ${steps.length} tiny steps. Start with the first one.` : 'Steps removed')
    onClose()
  }

  return (
    <Sheet title="Make it smaller" onClose={onClose}>
      <div className="stack">
        <p className="small muted" style={{ margin: 0 }}>
          <b>{task.title}</b>, in tiny steps. Change anything; the first step should feel almost too easy.
        </p>
        <ol className="steps-edit">
          {titles.map((t, i) => (
            <li key={i}>
              <span className="step-num">{i + 1}</span>
              <input className="input" value={t} onChange={(e) => setAt(i, e.target.value)} aria-label={`Step ${i + 1}`} />
              <button type="button" className="icon-btn" onClick={() => removeAt(i)} aria-label={`Remove step ${i + 1}`}>
                ✕
              </button>
            </li>
          ))}
        </ol>
        <form
          className="quick-add"
          onSubmit={(e) => {
            e.preventDefault()
            if (!adding.trim()) return
            setTitles((list) => [...list, adding.trim()])
            setAdding('')
          }}
        >
          <input placeholder="Add a step…" value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Add a step" />
          <button className="btn" type="submit" disabled={!adding.trim()}>
            Add
          </button>
        </form>
        <button className="btn primary big" onClick={save}>
          Save steps
        </button>
        {task.steps?.length > 0 && (
          <button className="btn ghost" onClick={() => setTitles(suggestSteps(task.title))}>
            Start over with suggestions
          </button>
        )}
      </div>
    </Sheet>
  )
}

/** The tick-off list of a task's steps (in the item menu and focus mode). */
export function StepsList({ task, big = false }) {
  const { actions } = useStore()
  if (!task?.steps?.length) return null
  const next = task.steps.find((s) => !s.done)
  return (
    <ul className={`steps-list ${big ? 'big' : ''}`}>
      {task.steps.map((s) => (
        <li key={s.id}>
          <button
            className={`step ${s.done ? 'done' : ''} ${s === next ? 'next' : ''}`}
            onClick={() => actions.toggleStep(task.id, s.id)}
            aria-pressed={s.done}
          >
            <span className="step-box" aria-hidden="true">
              {s.done ? '✓' : ''}
            </span>
            <span>{s.title}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
