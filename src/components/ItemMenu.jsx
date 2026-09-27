import { useState } from 'react'
import { formatDay } from '../lib/dates.js'
import { useStore } from '../store.jsx'
import TaskEditor from './TaskEditor.jsx'
import { Sheet, useToast } from './ui.jsx'

/** Actions for one scheduled item: done, focus, not today, move, edit. */
export default function ItemMenu({ item, onClose, onFocus }) {
  const { actions, state, today, schedule } = useStore()
  const toast = useToast()
  const [mode, setMode] = useState('menu')
  const task = state.tasks.find((t) => t.id === item.taskId)

  if (mode === 'edit' && task) return <TaskEditor task={task} onClose={onClose} />

  const days = schedule.days.map((d) => d.key)

  return (
    <Sheet title={item.title} onClose={onClose}>
      {item.why && (
        <p className="why">
          <span aria-hidden="true">💡</span> <span>{item.why}</span>
        </p>
      )}
      {mode === 'menu' ? (
        <div className="menu">
          <button
            onClick={() => {
              actions.complete(item)
              onClose()
            }}
          >
            ✓ Done
          </button>
          {onFocus && item.day === today && (
            <button
              onClick={() => {
                onFocus(item)
                onClose()
              }}
            >
              ◎ Focus on this now
            </button>
          )}
          {item.day === today && (
            <button
              onClick={() => {
                actions.notToday(item.key)
                toast('Moved to a better day')
                onClose()
              }}
            >
              → Not today
            </button>
          )}
          <button onClick={() => setMode('move')}>📅 Move to another day…</button>
          {item.day !== today && (
            <button
              onClick={() => {
                actions.moveToDay(item.key, today)
                toast('Added to today')
                onClose()
              }}
            >
              ☀ Do it today
            </button>
          )}
          {task && <button onClick={() => setMode('edit')}>✎ Edit task</button>}
        </div>
      ) : (
        <div className="menu">
          {days
            .filter((d) => d !== item.day)
            .map((d) => (
              <button
                key={d}
                onClick={() => {
                  actions.moveToDay(item.key, d, item.day)
                  toast(`Moved to ${formatDay(d, today)}`)
                  onClose()
                }}
              >
                {formatDay(d, today)}
              </button>
            ))}
        </div>
      )}
    </Sheet>
  )
}
