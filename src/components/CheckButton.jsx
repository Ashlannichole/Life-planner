import { useState } from 'react'

const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

/** Round check-off button with a small water/leaf burst. */
export default function CheckButton({ checked, onCheck, label = 'Mark done' }) {
  const [popping, setPopping] = useState(false)
  const on = checked || popping

  return (
    <button
      type="button"
      className={`check ${on ? 'on' : ''}`}
      aria-label={label}
      aria-pressed={on}
      onClick={(e) => {
        e.stopPropagation()
        if (!checked) {
          setPopping(true)
          setTimeout(() => setPopping(false), 700)
        }
        onCheck()
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {popping && (
        <span className="burst" aria-hidden="true">
          {ANGLES.map((a) => (
            <i key={a} style={{ '--a': `${a}deg` }} />
          ))}
        </span>
      )}
    </button>
  )
}
