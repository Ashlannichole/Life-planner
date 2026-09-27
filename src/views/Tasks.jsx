import { useEffect, useState } from 'react'
import TaskEditor from '../components/TaskEditor.jsx'
import { Icon, useToast } from '../components/ui.jsx'
import { formatDay } from '../lib/dates.js'
import { REPEATS, categoryById, durationLabel } from '../lib/model.js'
import { useStore } from '../store.jsx'

function repeatLabel(task) {
  if (task.repeat === 'everyX') return `every ${task.everyDays} days`
  if (task.repeat === 'none') return null
  return REPEATS.find((r) => r.id === task.repeat)?.label.toLowerCase()
}

function TaskRow({ task, nextDay, today, event, onOpen }) {
  const cat = categoryById(task.category)
  const rep = repeatLabel(task)
  return (
    <button className={`task-item ${task.type}`} onClick={onOpen}>
      <span className="stripe" />
      <span className="body">
        <span className="title" style={{ display: 'block' }}>
          {task.title}
        </span>
        <span className="meta">
          <span>{durationLabel(task.minutes)}</span>
          {rep && <span>· ↻ {rep}</span>}
          {cat && (
            <span>
              · {cat.icon} {cat.label}
            </span>
          )}
          {event && <span className="tag event">{event.title}</span>}
        </span>
      </span>
      <span className="small muted" style={{ whiteSpace: 'nowrap' }}>
        {nextDay ? formatDay(nextDay, today) : 'Later'}
      </span>
    </button>
  )
}

export default function Tasks() {
  const { state, schedule, today, actions } = useStore()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [editing, setEditing] = useState(null) // task, or { new: true, title }
  const [showDone, setShowDone] = useState(false)

  const active = state.tasks.filter((t) => t.repeat !== 'none' || !t.doneAt)
  const done = state.tasks.filter((t) => t.repeat === 'none' && t.doneAt).sort((a, b) => b.doneAt.localeCompare(a.doneAt))
  const needs = active.filter((t) => t.type !== 'want')
  const wants = active.filter((t) => t.type === 'want')
  const eventById = new Map(state.events.map((e) => [e.id, e]))

  // After adding, tell the user which day the app picked once the plan has updated.
  const [justAdded, setJustAdded] = useState(null)
  const announce = (task) => setJustAdded(task)
  useEffect(() => {
    if (!justAdded) return
    const day = schedule.nextDayForTask[justAdded.id]
    toast(day ? `“${justAdded.title}” → ${formatDay(day, today)}` : `Added “${justAdded.title}” for later`)
    setJustAdded(null)
  }, [justAdded, schedule, today, toast])

  const quickAdd = (e) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    announce(actions.addTask({ title: t }))
    setTitle('')
  }

  const section = (label, list) =>
    list.length > 0 && (
      <div className="section">
        <p className="section-title">
          {label} · {list.length}
        </p>
        <div className="task-list">
          {list.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              today={today}
              nextDay={schedule.nextDayForTask[t.id]}
              event={eventById.get(t.eventId)}
              onOpen={() => setEditing(t)}
            />
          ))}
        </div>
      </div>
    )

  return (
    <div className="stack">
      <div>
        <h1>Brain dump</h1>
        <p className="muted small" style={{ margin: 0 }}>
          Add everything here. I’ll decide what to do and when.
        </p>
      </div>

      <form className="quick-add" onSubmit={quickAdd}>
        <input
          placeholder="Add anything… (e.g. laundry, read a chapter)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="New task"
          enterKeyHint="done"
        />
        <button className="btn primary" type="submit" disabled={!title.trim()}>
          Add
        </button>
      </form>
      <button
        className="btn ghost small"
        style={{ alignSelf: 'flex-start', minHeight: 32, padding: '4px 8px' }}
        onClick={() => {
          setEditing({ new: true, title })
          setTitle('')
        }}
      >
        <Icon name="plus" width="16" height="16" /> Add with details
      </button>

      {active.length === 0 && (
        <div className="empty">
          <span className="big-emoji">🌱</span>
          Nothing here yet. Start with whatever is on your mind — chores, errands, and the fun stuff too.
        </div>
      )}

      {section('Need to', needs)}
      {section('Want to', wants)}

      {done.length > 0 && (
        <div className="section">
          <button className="section-title" onClick={() => setShowDone((s) => !s)}>
            {showDone ? '▾' : '▸'} Done · {done.length}
          </button>
          {showDone && (
            <div className="task-list">
              {done.slice(0, 50).map((t) => (
                <div key={t.id} className={`task-item done ${t.type}`}>
                  <span className="stripe" />
                  <span className="body">
                    <span className="title">{t.title}</span>
                  </span>
                  <span className="small muted">{formatDay(t.doneAt, today)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && (
        <TaskEditor
          task={editing.new ? null : editing}
          initialTitle={editing.new ? editing.title : ''}
          onClose={() => setEditing(null)}
          onSaved={announce}
        />
      )}
    </div>
  )
}
