import { useEffect, useState } from 'react'
import { categoryById, durationLabel } from '../lib/model.js'
import { playChime } from '../lib/sound.js'
import { useStore } from '../store.jsx'
import Plant from './Plant.jsx'
import { Icon } from './ui.jsx'

function Timer({ minutes, soundOn }) {
  const total = minutes * 60
  const [left, setLeft] = useState(total)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (left === 0 && running) {
      setRunning(false)
      if (soundOn) playChime()
    }
  }, [left, running, soundOn])

  const r = 64
  const c = 2 * Math.PI * r
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')

  if (!running && left === total) {
    return (
      <button className="btn" onClick={() => setRunning(true)}>
        <Icon name="play" width="18" height="18" /> Start a {durationLabel(minutes).replace('+', '')} timer
      </button>
    )
  }
  return (
    <div className="stack" style={{ alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative' }}>
        <svg className="timer-ring" viewBox="0 0 150 150" aria-hidden="true">
          <circle className="track" cx="75" cy="75" r={r} />
          <circle
            className="progress"
            cx="75"
            cy="75"
            r={r}
            strokeDasharray={c}
            strokeDashoffset={c * (1 - left / total)}
            transform="rotate(-90 75 75)"
          />
        </svg>
        <div
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
          role="timer"
        >
          {left === 0 ? 'Time!' : `${mm}:${ss}`}
        </div>
      </div>
      {left > 0 ? (
        <button className="btn ghost" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Resume'}
        </button>
      ) : (
        <p className="muted small">Time’s up — finish it, or keep going. Either is fine.</p>
      )}
    </div>
  )
}

export default function Focus({ startKey, onClose }) {
  const { schedule, state, actions } = useStore()
  const items = schedule.days[0].items
  const [currentKey, setCurrentKey] = useState(startKey || null)
  const [leaving, setLeaving] = useState(false)
  const [dropping, setDropping] = useState(false)
  const [skipOpen, setSkipOpen] = useState(false)
  const [doneCount, setDoneCount] = useState(0)

  const current = items.find((i) => i.key === currentKey) || items[0]
  const plant = state.plant.current

  const advance = (fn) => {
    setLeaving(true)
    setSkipOpen(false)
    setTimeout(() => {
      fn()
      setCurrentKey(null)
      setLeaving(false)
    }, 380)
  }

  const done = () => {
    setDropping(true)
    setTimeout(() => setDropping(false), 800)
    setDoneCount((n) => n + 1)
    advance(() => actions.complete(current))
  }

  return (
    <div className="focus" role="dialog" aria-modal="true" aria-label="Focus mode">
      <div className="focus-top">
        <button className="icon-btn" onClick={onClose} aria-label="Close focus mode">
          <Icon name="close" />
        </button>
        <div style={{ position: 'relative' }}>
          {dropping && <span className="drop" aria-hidden="true" />}
          <Plant typeId={plant.typeId} potId={plant.potId} water={plant.water} size={48} />
        </div>
      </div>

      {current ? (
        <>
          <div className="focus-stage">
            <div className={`focus-card ${leaving ? 'out' : ''}`} key={current.key}>
              <div className="stack" style={{ alignItems: 'center', gap: 14 }}>
                <span className={`tag ${current.type === 'want' ? 'want' : ''}`}>
                  {current.type === 'want' ? 'Want to' : 'Need to'}
                  {categoryById(current.category) ? ` · ${categoryById(current.category).icon} ${categoryById(current.category).label}` : ''}
                </span>
                <div className="focus-title">{current.title}</div>
                <span className="muted">{durationLabel(current.minutes)}</span>
                <Timer key={current.key} minutes={current.minutes} soundOn={state.settings.sound} />
              </div>
            </div>
          </div>
          <div className="focus-actions">
            <button className="done-btn" onClick={done} disabled={leaving}>
              Done
            </button>
            {skipOpen ? (
              <div className="row">
                <button className="btn block" onClick={() => advance(() => actions.laterToday(current.key))}>
                  Later today
                </button>
                <button className="btn block" onClick={() => advance(() => actions.notToday(current.key))}>
                  Tomorrow or later
                </button>
              </div>
            ) : (
              <button className="btn ghost" onClick={() => setSkipOpen(true)} disabled={items.length === 0}>
                Skip for now
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="focus-stage">
          <Plant typeId={plant.typeId} potId={plant.potId} water={plant.water} size={140} />
          <h1>All done for today</h1>
          <p className="muted">
            {doneCount > 0
              ? `You finished ${doneCount} ${doneCount === 1 ? 'thing' : 'things'} in this session. Your plant loved it.`
              : 'Nothing left on today’s list. Enjoy the quiet.'}
          </p>
          <button className="btn primary" onClick={onClose}>
            Back to today
          </button>
        </div>
      )}
    </div>
  )
}
