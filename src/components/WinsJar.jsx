import { useMemo, useState } from 'react'
import { formatShortDate } from '../lib/dates.js'
import { SLIP_COLORS, jarCount, pullWin, winSlips } from '../lib/wins.js'
import { useStore } from '../store.jsx'

const MAX_SLIPS = 48

// Same jumble every time for the same count, so the jar doesn't reshuffle on every render.
function slipLayout(count) {
  const shown = Math.min(count, MAX_SLIPS)
  return Array.from({ length: shown }, (_, i) => {
    const row = Math.floor(i / 6)
    const col = i % 6
    const wobble = ((i * 37) % 11) - 5
    return {
      x: 34 + col * 12 + (row % 2 ? 5 : 0) + wobble * 0.4,
      y: 150 - row * 9 - ((i * 13) % 5),
      r: ((i * 53) % 70) - 35,
      color: SLIP_COLORS[(i * 3) % SLIP_COLORS.length],
    }
  })
}

function Jar({ count, shaking }) {
  const slips = useMemo(() => slipLayout(count), [count])
  return (
    <svg viewBox="0 0 140 170" width="120" height="146" className={`wins-jar ${shaking ? 'shaking' : ''}`} role="img" aria-label={`A jar with ${count} wins in it`}>
      <rect x="40" y="6" width="60" height="14" rx="4" className="jar-lid" />
      <path d="M44 20 h52 v8 q18 6 18 26 v96 q0 12 -12 12 h-64 q-12 0 -12 -12 v-96 q0 -20 18 -26z" className="jar-glass" />
      <g clipPath="url(#jar-inside)">
        {slips.map((s, i) => (
          <rect key={i} x={s.x} y={s.y} width="13" height="7" rx="1.5" fill={s.color} transform={`rotate(${s.r} ${s.x + 6} ${s.y + 3})`} />
        ))}
      </g>
      <defs>
        <clipPath id="jar-inside">
          <path d="M46 30 q-14 6 -14 24 v96 q0 9 9 9 h58 q9 0 9 -9 v-96 q0 -18 -14 -24z" />
        </clipPath>
      </defs>
      <path d="M38 60 q-2 30 0 70" className="jar-shine" />
    </svg>
  )
}

/** Free: every finished thing goes in the jar. Shake it for a reminder of what you've done. */
export default function WinsJar() {
  const { state, actions } = useStore()
  const slips = useMemo(() => winSlips(state), [state])
  const count = jarCount(state)
  const [pulled, setPulled] = useState(null)
  const [shaking, setShaking] = useState(false)
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')

  const shake = () => {
    setShaking(true)
    navigator.vibrate?.(25)
    setTimeout(() => {
      setShaking(false)
      setPulled(pullWin(slips, Math.random, pulled?.id))
    }, 650)
  }

  const add = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    actions.addWin(text)
    setText('')
    setAdding(false)
  }

  return (
    <div className="card wins-card">
      <Jar count={count} shaking={shaking} />
      <div className="stack" style={{ gap: 8, flex: 1, minWidth: 0 }}>
        <div>
          <p className="section-title" style={{ margin: 0 }}>
            Wins jar
          </p>
          <p className="small muted" style={{ margin: 0 }}>
            {count ? `${count} ${count === 1 ? 'win' : 'wins'} inside. Every finished thing goes in.` : 'Every finished thing drops a slip in here.'}
          </p>
        </div>
        {pulled && !shaking && (
          <div className="win-slip" role="status">
            <span className="tiny muted">{pulled.own ? `You wrote, ${formatShortDate(pulled.date)}` : `${formatShortDate(pulled.date)} you did`}</span>
            <b>{pulled.text}</b>
          </div>
        )}
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {slips.length > 0 && (
            <button className="btn small primary" onClick={shake} disabled={shaking}>
              {pulled ? 'Shake again' : 'Shake the jar'}
            </button>
          )}
          {!adding && (
            <button className="btn small ghost" onClick={() => setAdding(true)}>
              + Add a win
            </button>
          )}
        </div>
        {adding && (
          <form className="quick-add" onSubmit={add}>
            <input autoFocus placeholder="Got out of bed, called mom…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Your win" />
            <button className="btn" type="submit" disabled={!text.trim()}>
              Add
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
