import { useState } from 'react'
import { formatShortDate } from '../lib/dates.js'
import { useStore } from '../store.jsx'
import { Segmented, Sheet, Toggle, useToast } from './ui.jsx'

const KINDS = [
  { id: 'birthday', label: '🎂 Birthday' },
  { id: 'anniversary', label: '💍 Anniversary' },
]

const pad = (n) => String(n).padStart(2, '0')
const sortKey = (d) => `${pad(d.month)}-${pad(d.day)}`

/**
 * Birthdays and anniversaries: they come back every year, show on the calendar and
 * never take up planning time. With holiday prep on, each one gets a "how do you want
 * to celebrate?" card a few weeks ahead.
 */
export default function SpecialDaysSheet({ onClose }) {
  const { state, actions } = useStore()
  const toast = useToast()
  const [kind, setKind] = useState('birthday')
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [withYear, setWithYear] = useState(false)
  // Your own birthday lives in Settings; this list is everyone else's days.
  const days = (state.specialDays || []).filter((d) => !d.self).sort((a, b) => sortKey(a).localeCompare(sortKey(b)))

  const save = (e) => {
    e.preventDefault()
    if (!date || (kind === 'birthday' && !name.trim())) return
    const [y, m, d] = date.split('-').map(Number)
    actions.saveSpecialDay({ kind, name: name.trim() || 'Our', month: m, day: d, year: withYear ? y : null })
    toast(kind === 'birthday' ? `🎂 ${name.trim()}’s birthday added` : '💍 Anniversary added')
    setName('')
    setDate('')
    setWithYear(false)
  }

  const label = (sd) =>
    sd.kind === 'anniversary' ? (/^(our|us|me)$/i.test(sd.name) ? 'Our anniversary' : `${sd.name}’s anniversary`) : `${sd.name}’s birthday`

  return (
    <Sheet title="Birthdays & anniversaries" onClose={onClose}>
      <div className="stack">
        <p className="small muted" style={{ margin: 0 }}>
          They come back every year and show on your calendar. They don’t take up any planning time.
        </p>
        {days.length > 0 && (
          <div className="menu">
            {days.map((sd) => (
              <div key={sd.id} className="row spread" style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)' }}>
                <span>
                  {sd.kind === 'anniversary' ? '💍' : '🎂'} {label(sd)}
                  <span className="small muted"> · {formatShortDate(`2000-${pad(sd.month)}-${pad(sd.day)}`)}{sd.year ? `, ${sd.year}` : ''}</span>
                </span>
                <button className="btn ghost danger small" onClick={() => actions.deleteSpecialDay(sd.id)} aria-label={`Remove ${label(sd)}`}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <form className="stack" onSubmit={save}>
          <Segmented options={KINDS} value={kind} onChange={setKind} />
          <input
            className="input"
            placeholder={kind === 'birthday' ? 'Whose birthday? (e.g. Mom)' : 'Whose? Leave empty for yours (e.g. Mom & Dad)'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Name"
          />
          <div className="field">
            <label htmlFor="sd-date">Date</label>
            <input id="sd-date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="row spread">
            <span className="small">{kind === 'birthday' ? 'That’s the year they were born (shows their age)' : 'That’s the year it started (shows how many years)'}</span>
            <Toggle on={withYear} onChange={setWithYear} label="Use the year" />
          </div>
          <button className="btn primary big" type="submit" disabled={!date || (kind === 'birthday' && !name.trim())}>
            Add {kind === 'birthday' ? 'birthday' : 'anniversary'}
          </button>
        </form>
      </div>
    </Sheet>
  )
}
