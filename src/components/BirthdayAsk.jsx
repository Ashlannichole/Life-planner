import { useState } from 'react'
import { useStore } from '../store.jsx'
import { useToast } from './ui.jsx'

const pad = (n) => String(n).padStart(2, '0')

/** The person's own birthday as a date-input value ('' when not set). */
export function myBirthdayValue(specialDays = []) {
  const me = specialDays.find((d) => d.self)
  return me ? `${me.year || 2000}-${pad(me.month)}-${pad(me.day)}` : ''
}

/** '1995-11-03' → { year, month, day } for actions.setMyBirthday. */
export function parseBirthday(value) {
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

/**
 * Asks once on Today for people who set up before birthdays were asked during setup.
 * Your birthday shows on the calendar, gets a party theme with Plus, and a "how do you
 * want to celebrate?" card a few weeks ahead with holiday prep.
 */
export default function BirthdayAsk() {
  const { state, actions } = useStore()
  const toast = useToast()
  const [value, setValue] = useState('')
  if (state.settings.birthdayAsked || state.specialDays?.some((d) => d.self)) return null

  return (
    <form
      className="card holiday-card stack"
      style={{ gap: 10 }}
      onSubmit={(e) => {
        e.preventDefault()
        if (!value) return
        actions.setMyBirthday(parseBirthday(value))
        toast('🎂 Saved! Your day will be extra special.')
      }}
    >
      <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
        <span className="holiday-emoji" aria-hidden="true">
          🎂
        </span>
        <div>
          <b>When’s your birthday?</b>
          <p className="small muted" style={{ margin: '2px 0 0' }}>
            I’ll put it on your calendar and make the day special.
          </p>
        </div>
      </div>
      <input className="input" type="date" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Your birthday" />
      <div className="row">
        <button className="btn primary" type="submit" disabled={!value}>
          Save
        </button>
        <button className="btn ghost" type="button" onClick={() => actions.updateSettings({ birthdayAsked: true })}>
          Not now
        </button>
      </div>
    </form>
  )
}
