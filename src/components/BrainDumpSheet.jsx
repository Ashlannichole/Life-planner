import { useMemo, useState } from 'react'
import { parseDump } from '../lib/braindump.js'
import { formatDay } from '../lib/dates.js'
import { durationLabel } from '../lib/model.js'
import { useStore } from '../store.jsx'
import { Sheet, useToast } from './ui.jsx'

/**
 * Plus: get everything out of your head at once. One thing per line (or commas);
 * "tomorrow", "friday", "by friday" and "20 min" are picked up. Sprout plans the rest.
 */
export default function BrainDumpSheet({ onClose }) {
  const { actions, today } = useStore()
  const toast = useToast()
  const [text, setText] = useState('')
  const [dropped, setDropped] = useState(() => new Set())
  const items = useMemo(() => parseDump(text, today), [text, today])
  const keep = items.filter((_, i) => !dropped.has(i))

  const add = () => {
    for (const item of keep) actions.addTask(item)
    toast(`🧠 ${keep.length} ${keep.length === 1 ? 'thing' : 'things'} out of your head and into the plan`)
    onClose()
  }

  return (
    <Sheet title="Brain dump" onClose={onClose}>
      <div className="stack">
        <p className="small muted" style={{ margin: 0 }}>
          Everything on your mind, one per line. Add “tomorrow”, “friday”, “by friday” or “20 min” if you like. I’ll sort out when.
        </p>
        <textarea
          className="input"
          rows={6}
          autoFocus
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setDropped(new Set())
          }}
          placeholder={'call the dentist tomorrow\npay rent by friday\nlaundry\ncrochet 1h'}
          aria-label="Brain dump"
        />
        {items.length > 0 && (
          <div className="task-list">
            {items.map((item, i) => (
              <div key={i} className={`task-item ${item.type} ${dropped.has(i) ? 'dump-dropped' : ''}`}>
                <div className="body" style={{ padding: '10px 4px 10px 14px' }}>
                  <div className="title">{item.title}</div>
                  <span className="meta">
                    {item.onDate && <span>📅 {formatDay(item.onDate, today)}</span>}
                    {item.deadline && <span>⏳ by {formatDay(item.deadline, today)}</span>}
                    {item.minutes && <span>{durationLabel(item.minutes)}</span>}
                    {item.type === 'want' && <span className="tag want">fun</span>}
                  </span>
                </div>
                <button
                  className="icon-btn"
                  onClick={() =>
                    setDropped((s) => {
                      const next = new Set(s)
                      if (next.has(i)) next.delete(i)
                      else next.add(i)
                      return next
                    })
                  }
                  aria-label={dropped.has(i) ? `Keep ${item.title}` : `Leave out ${item.title}`}
                >
                  {dropped.has(i) ? '↺' : '✕'}
                </button>
              </div>
            ))}
          </div>
        )}
        <button className="btn primary big" onClick={add} disabled={!keep.length}>
          {keep.length ? `Add ${keep.length} ${keep.length === 1 ? 'thing' : 'things'} to my plan` : 'Add to my plan'}
        </button>
      </div>
    </Sheet>
  )
}
