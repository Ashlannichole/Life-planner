import { useState } from 'react'
import { addDays, todayKey } from '../lib/dates.js'
import { useStore } from '../store.jsx'
import { Sheet, useToast } from './ui.jsx'

/** Decide what to do with a task that kept getting pushed. No wrong answers. */
export default function CompostSheet({ task, onClose }) {
  const { actions } = useStore()
  const toast = useToast()
  const [mode, setMode] = useState('menu')
  const [day, setDay] = useState(() => addDays(todayKey(), 1))
  const [steps, setSteps] = useState(`Just start: ${task.title.toLowerCase()} for 10 minutes`)

  const done = (message) => {
    toast(message)
    onClose()
  }

  return (
    <Sheet title={task.title} onClose={onClose}>
      <p className="why">
        <span aria-hidden="true">🍂</span>
        <span>
          This got pushed {task.pushes || 'a few'} times. That usually means it’s too big, not the right time, or not actually
          needed. All of those are fine.
        </span>
      </p>

      {mode === 'menu' && (
        <div className="menu">
          <button onClick={() => setMode('date')}>📅 Pick a real day for it</button>
          <button onClick={() => setMode('smaller')}>✂️ Break it into something smaller</button>
          <button
            onClick={() => {
              actions.compostRetry(task.id)
              done('Back in the mix')
            }}
          >
            ↻ Give it another go
          </button>
          <button
            onClick={() => {
              actions.compostDelete(task.id)
              done('Composted. Your plant got a little boost 🌱')
            }}
          >
            🍂 Compost it (let it go)
          </button>
        </div>
      )}

      {mode === 'date' && (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            actions.compostSchedule(task.id, day)
            done('Set for that day')
          }}
        >
          <input className="input" type="date" min={todayKey()} value={day} onChange={(e) => setDay(e.target.value)} aria-label="Day" />
          <button className="btn primary big" type="submit" disabled={!day}>
            Put it on that day
          </button>
          <button type="button" className="btn ghost" onClick={() => setMode('menu')}>
            Back
          </button>
        </form>
      )}

      {mode === 'smaller' && (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            const list = steps
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean)
            if (!list.length) return
            actions.compostBreakUp(task.id, list)
            done(list.length === 1 ? 'Smaller step added' : `${list.length} small steps added`)
          }}
        >
          <label className="label" htmlFor="steps">
            Small steps, one per line. The first one can be tiny.
          </label>
          <textarea id="steps" className="input" rows={4} value={steps} onChange={(e) => setSteps(e.target.value)} autoFocus />
          <button className="btn primary big" type="submit" disabled={!steps.trim()}>
            Replace with these steps
          </button>
          <button type="button" className="btn ghost" onClick={() => setMode('menu')}>
            Back
          </button>
        </form>
      )}
    </Sheet>
  )
}
