import { useState } from 'react'
import { addDays, formatDay, todayKey } from '../lib/dates.js'
import { CATEGORIES, DURATIONS, PREFERRED_TIMES, REPEATS, durationLabel, guessFromTitle } from '../lib/model.js'
import { useStore } from '../store.jsx'
import { Chips, Segmented, Sheet } from './ui.jsx'

const TYPES = [
  { id: 'need', label: 'Need to' },
  { id: 'want', label: 'Want to' },
]

/** Add or edit a task. Only the title is required; everything else has a default. */
export default function TaskEditor({ task, initialTitle = '', initialDate = null, onClose, onSaved }) {
  const { actions } = useStore()
  const [draft, setDraft] = useState(() => {
    if (task) return { ...task }
    const guess = guessFromTitle(initialTitle)
    return {
      title: initialTitle,
      type: guess.type,
      minutes: 30,
      repeat: 'none',
      everyDays: 3,
      preferredTime: null,
      category: guess.category,
      onDate: initialDate,
    }
  })
  const today = todayKey()
  const tomorrow = addDays(today, 1)
  const whenChoice = !draft.onDate ? 'any' : draft.onDate === today ? 'today' : draft.onDate === tomorrow ? 'tomorrow' : 'pick'
  const [picking, setPicking] = useState(whenChoice === 'pick')
  const [touched, setTouched] = useState({ type: !!task, category: !!task })
  const set = (fields) => setDraft((d) => ({ ...d, ...fields }))

  const onTitle = (title) => {
    // Keep guessing the category/type from the title until the user picks one.
    const guess = guessFromTitle(title)
    set({
      title,
      ...(touched.category ? {} : { category: guess.category }),
      ...(touched.type ? {} : { type: guess.type }),
    })
  }

  const save = (e) => {
    e?.preventDefault()
    const title = draft.title.trim()
    if (!title) return
    if (task) actions.updateTask(task.id, { ...draft, title })
    else onSaved?.(actions.addTask({ ...draft, title }))
    onClose()
  }

  return (
    <Sheet title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <form className="stack" onSubmit={save}>
        <input
          className="input"
          placeholder="What is it?"
          value={draft.title}
          autoFocus={!task}
          onChange={(e) => onTitle(e.target.value)}
          aria-label="Title"
        />
        <Segmented
          options={TYPES}
          value={draft.type}
          onChange={(type) => {
            setTouched((t) => ({ ...t, type: true }))
            set({ type })
          }}
        />
        <div className="field">
          <span className="label">About how long?</span>
          <Chips
            options={[...new Set([...DURATIONS, draft.minutes])].sort((a, b) => a - b).map((m) => ({ id: m, label: durationLabel(m) }))}
            value={draft.minutes}
            onChange={(minutes) => set({ minutes })}
            className={draft.type === 'want' ? 'want' : ''}
          />
        </div>
        <div className="field">
          <span className="label">Repeats</span>
          <Chips
            options={REPEATS}
            value={draft.repeat}
            // A repeating task has no single day; "Daily" already means every day.
            onChange={(repeat) => set(repeat === 'none' ? { repeat } : { repeat, onDate: null })}
            className={draft.type === 'want' ? 'want' : ''}
          />
          {draft.repeat === 'everyX' && (
            <div className="row">
              <span>Every</span>
              <input
                className="input"
                style={{ width: 80 }}
                type="number"
                min="1"
                max="365"
                value={draft.everyDays}
                onChange={(e) => set({ everyDays: Math.max(1, Number(e.target.value) || 1) })}
                aria-label="Number of days"
              />
              <span>days</span>
            </div>
          )}
        </div>
        {draft.repeat === 'none' && (
          <div className="field">
            <span className="label">Which day?</span>
            <Chips
              options={[
                { id: 'any', label: 'Whenever it fits' },
                { id: 'today', label: 'Today' },
                { id: 'tomorrow', label: 'Tomorrow' },
                { id: 'pick', label: picking && draft.onDate && whenChoice === 'pick' ? formatDay(draft.onDate, today) : 'Pick a day' },
              ]}
              value={picking ? 'pick' : whenChoice}
              onChange={(choice) => {
                setPicking(choice === 'pick')
                if (choice === 'any') set({ onDate: null })
                if (choice === 'today') set({ onDate: today })
                if (choice === 'tomorrow') set({ onDate: tomorrow })
                if (choice === 'pick') set({ onDate: draft.onDate && draft.onDate > tomorrow ? draft.onDate : addDays(today, 2) })
              }}
              className={draft.type === 'want' ? 'want' : ''}
            />
            {picking && (
              <input
                className="input"
                type="date"
                min={today}
                value={draft.onDate || ''}
                onChange={(e) => set({ onDate: e.target.value || null })}
                aria-label="Day"
              />
            )}
            {draft.onDate && (
              <p className="small muted" style={{ margin: 0 }}>
                It goes on that day’s list even if the day is full.
              </p>
            )}
          </div>
        )}
        <div className="field">
          <span className="label">Best time (optional)</span>
          <Chips options={PREFERRED_TIMES} value={draft.preferredTime} onChange={(preferredTime) => set({ preferredTime })} className={draft.type === 'want' ? 'want' : ''} />
        </div>
        <div className="field">
          <span className="label">Category (optional)</span>
          <Chips
            options={CATEGORIES}
            value={draft.category}
            className={draft.type === 'want' ? 'want' : ''}
            onChange={(category) => {
              setTouched((t) => ({ ...t, category: true }))
              set({ category: draft.category === category ? null : category })
            }}
          />
        </div>
        <button className="btn primary big" type="submit" disabled={!draft.title.trim()}>
          {task ? 'Save' : 'Add task'}
        </button>
        {task && (
          <button
            type="button"
            className="btn ghost danger"
            onClick={() => {
              actions.deleteTask(task.id)
              onClose()
            }}
          >
            Delete task
          </button>
        )}
      </form>
    </Sheet>
  )
}
