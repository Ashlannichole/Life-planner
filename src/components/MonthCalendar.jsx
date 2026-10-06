import { useState } from 'react'
import { addMonths, formatDay, formatMonth, formatShortDate, formatTime, monthGrid, startOfMonth, weekday } from '../lib/dates.js'
import { eventsOnDay } from '../lib/scheduler.js'
import { Icon } from './ui.jsx'

const WEEK_HEAD = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MAX_IN_CELL = 2

/**
 * A month at a glance: events only (no chores). Tap a day to see its events below the
 * grid and add one on that day; tap an event to open it.
 */
export default function MonthCalendar({ events, today, onOpenEvent, onAddOnDay }) {
  const [month, setMonth] = useState(() => startOfMonth(today))
  const [selected, setSelected] = useState(today)
  const weeks = monthGrid(month)
  const inMonth = (key) => key.slice(0, 7) === month.slice(0, 7)

  const byDay = (key) =>
    eventsOnDay(events, key).sort((a, b) => Number(!a.allDay) - Number(!b.allDay) || (a.start || '').localeCompare(b.start || ''))
  const dayEvents = byDay(selected)

  const go = (n) => {
    const next = addMonths(month, n)
    setMonth(next)
    setSelected(startOfMonth(today) === next ? today : next)
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row spread">
        <button className="icon-btn" onClick={() => go(-1)} aria-label="Previous month">
          <Icon name="chevronLeft" />
        </button>
        <button
          className="month-title"
          onClick={() => {
            setMonth(startOfMonth(today))
            setSelected(today)
          }}
          aria-label={`${formatMonth(month)}, go to this month`}
        >
          {formatMonth(month)}
        </button>
        <button className="icon-btn" onClick={() => go(1)} aria-label="Next month">
          <Icon name="chevronRight" />
        </button>
      </div>

      <div className="month-grid" role="grid" aria-label={formatMonth(month)}>
        {WEEK_HEAD.map((d, i) => (
          <div key={i} className="month-head" aria-hidden="true">
            {d}
          </div>
        ))}
        {weeks.flat().map((key) => {
          const list = byDay(key)
          const extra = list.length - MAX_IN_CELL
          const classes = ['month-cell']
          if (!inMonth(key)) classes.push('other')
          if (key === today) classes.push('today')
          if (key === selected) classes.push('selected')
          if (key < today) classes.push('past')
          return (
            <button
              key={key}
              role="gridcell"
              className={classes.join(' ')}
              onClick={() => setSelected(key)}
              aria-label={`${formatDay(key)}${list.length ? `, ${list.length} event${list.length === 1 ? '' : 's'}` : ''}`}
              aria-selected={key === selected}
            >
              <span className="month-date">{Number(key.slice(8))}</span>
              {list.slice(0, MAX_IN_CELL).map((e) => (
                <span
                  key={e.id}
                  className={`month-event ${e.endDate && e.endDate > e.date ? 'span' : ''} ${e.date < key ? 'cont-left' : ''} ${
                    (e.endDate || e.date) > key ? 'cont-right' : ''
                  }`}
                >
                  {/* A multi-day event names itself where it starts and at the start of each row. */}
                  {e.date === key || weekday(key) === 1 ? e.title : '\u00a0'}
                </span>
              ))}
              {extra > 0 && <span className="month-more">+{extra}</span>}
            </button>
          )
        })}
      </div>

      <div className="stack" style={{ gap: 8 }}>
        <p className="section-title" style={{ margin: 0 }}>
          {formatDay(selected, today)}
        </p>
        {dayEvents.length ? (
          <div className="task-list">
            {dayEvents.map((e) => (
              <button key={e.id} className="task-item" onClick={() => onOpenEvent(e)}>
                <span className="stripe" style={{ background: 'var(--event)' }} />
                <span className="body">
                  <span className="title" style={{ display: 'block' }}>
                    {e.title}
                  </span>
                  <span className="meta">
                    {e.endDate && e.endDate > e.date
                      ? `${formatShortDate(e.date)} – ${formatShortDate(e.endDate)}`
                      : e.allDay
                        ? 'All day'
                        : `${formatTime(e.start)}–${formatTime(e.end)}`}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="small muted" style={{ margin: 0 }}>
            Nothing on this day.
          </p>
        )}
        {selected >= today && (
          <button className="btn ghost" onClick={() => onAddOnDay(selected)}>
            <Icon name="plus" width="18" height="18" /> Add an event on {formatDay(selected, today)}
          </button>
        )}
      </div>
    </div>
  )
}
