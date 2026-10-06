import { holidayToAsk, snoozeUntil, untilText } from '../lib/holidays.js'
import { hasPlus } from '../lib/plus.js'
import { useStore } from '../store.jsx'
import { useToast } from './ui.jsx'

/**
 * Plus: when a holiday is coming up, ask about plans in one tap and turn the answer
 * into an event and prep tasks scheduled backward from the day.
 */
export default function HolidayCard() {
  const { state, today, actions } = useStore()
  const toast = useToast()
  if (!state.settings.holidayPrep || !hasPlus(state)) return null
  const holiday = holidayToAsk(state.holidayPlans, today, state.specialDays)
  if (!holiday) return null

  return (
    <div className="card holiday-card stack" style={{ gap: 10 }}>
      <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
        <span className="holiday-emoji" aria-hidden="true">
          {holiday.emoji}
        </span>
        <div>
          <b>
            {holiday.name} is {untilText(today, holiday.date)}
            {holiday.detail ? ` (${holiday.detail})` : ''}.
          </b>
          <p className="small muted" style={{ margin: '2px 0 0' }}>
            {holiday.question} I’ll plan the prep for you.
          </p>
        </div>
      </div>
      <div className="chips">
        {holiday.answers.map((a) => (
          <button
            key={a.id}
            className={`chip ${a.id === 'skip' ? '' : 'on'}`}
            onClick={() => {
              const n = actions.answerHoliday(holiday, a)
              toast(n ? `${holiday.emoji} Added ${n} prep task${n === 1 ? '' : 's'} for ${holiday.name}` : `Got it, no ${holiday.name} prep this year`)
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
      <button className="btn ghost small" style={{ alignSelf: 'flex-start' }} onClick={() => actions.snoozeHoliday(holiday.key, snoozeUntil(today, holiday.date))}>
        Ask me later
      </button>
    </div>
  )
}
