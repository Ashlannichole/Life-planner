import { useState } from 'react'
import EventEditor from '../components/EventEditor.jsx'
import PackingList from '../components/PackingList.jsx'
import PrepAdder from '../components/PrepAdder.jsx'
import { Icon, Sheet, useToast } from '../components/ui.jsx'
import { diffDays, formatDay, formatShortDate, formatTime } from '../lib/dates.js'
import { findPrepTemplate, fitDaysBefore, templateWithItems } from '../lib/prep.js'
import { useStore } from '../store.jsx'

function when(e, today) {
  const date = e.endDate ? `${formatShortDate(e.date)} – ${formatShortDate(e.endDate)}` : formatDay(e.date, today)
  return e.allDay ? date : `${date} · ${formatTime(e.start)}–${formatTime(e.end)}`
}

function EventDetail({ event, onClose, onEdit }) {
  const { state, schedule, today, actions } = useStore()
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
  const template = findPrepTemplate(state, event.prepTemplateId)
  const prep = state.tasks
    .filter((t) => t.eventId === event.id)
    .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''))
  const days = diffDays(today, event.date)

  return (
    <Sheet title={event.title} onClose={onClose}>
      <div className="stack">
        <p className="muted" style={{ margin: 0 }}>
          {when(event, today)}
          {days > 0 && ` · in ${days} ${days === 1 ? 'day' : 'days'}`}
        </p>

        {prep.length > 0 && (
          <div className="stack" style={{ gap: 8 }}>
            <p className="section-title" style={{ margin: 0 }}>
              Prep
            </p>
            <div className="menu">
              {prep.map((t) => {
                const planned = schedule.nextDayForTask[t.id]
                return (
                  <div key={t.id} className="row spread" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
                    <span style={{ textDecoration: t.doneAt ? 'line-through' : 'none', color: t.doneAt ? 'var(--muted)' : undefined }}>
                      {t.doneAt ? '✓ ' : ''}
                      {t.title}
                    </span>
                    <span className="small muted">{t.doneAt ? 'done' : planned ? formatDay(planned, today) : `from ${formatShortDate(t.notBefore)}`}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(event.endDate || event.date) >= today && (
          <PrepAdder
            title={event.title}
            isTrip={event.prepTemplateId === 'trip' || !!event.endDate}
            existingTitles={prep.map((t) => t.title)}
            templateName={template?.name}
            onAdd={(items, remember) => {
              actions.addPrepTasks(
                event,
                items.map((i) => ({ ...i, daysBefore: fitDaysBefore(today, event.date, i.daysBefore) })),
              )
              if (remember && template) actions.savePrepTemplate(templateWithItems(template, items))
              toast(items.length === 1 ? `Added “${items[0].title}”` : `Added ${items.length} prep tasks`)
            }}
          />
        )}

        {(event.packing?.length > 0 || event.prepTemplateId) && <PackingList event={event} />}
        {!event.packing?.length && !event.prepTemplateId && (
          <details>
            <summary className="small muted">Add a packing list</summary>
            <div style={{ marginTop: 8 }}>
              <PackingList event={event} />
            </div>
          </details>
        )}

        <div className="row">
          <button className="btn block" onClick={onEdit}>
            Edit
          </button>
          {confirm ? (
            <button
              className="btn block danger"
              onClick={() => {
                actions.deleteEvent(event.id)
                onClose()
              }}
            >
              Yes, remove it
            </button>
          ) : (
            <button className="btn block danger" onClick={() => setConfirm(true)}>
              Remove
            </button>
          )}
        </div>
      </div>
    </Sheet>
  )
}

export default function Events() {
  const { state, today } = useStore()
  const [editing, setEditing] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [showPast, setShowPast] = useState(false)

  const sorted = [...state.events].sort((a, b) => a.date.localeCompare(b.date) || (a.start || '').localeCompare(b.start || ''))
  const upcoming = sorted.filter((e) => (e.endDate || e.date) >= today)
  const past = sorted.filter((e) => (e.endDate || e.date) < today).reverse()
  const open = state.events.find((e) => e.id === openId)

  const row = (e) => {
    const prepCount = state.tasks.filter((t) => t.eventId === e.id).length
    return (
      <button key={e.id} className="task-item" onClick={() => setOpenId(e.id)}>
        <span className="stripe" style={{ background: 'var(--event)' }} />
        <span className="body">
          <span className="title" style={{ display: 'block' }}>
            {e.title}
          </span>
          <span className="meta">
            {when(e, today)}
            {prepCount > 0 && <span className="tag event">{prepCount} prep</span>}
            {e.packing?.length > 0 && <span className="tag event">packing</span>}
          </span>
        </span>
      </button>
    )
  }

  return (
    <div className="stack">
      <div className="row spread">
        <div>
          <h1>Events</h1>
          <p className="muted small" style={{ margin: 0 }}>
            The plan works around these automatically.
          </p>
        </div>
        <button className="btn primary" onClick={() => setEditing({ new: true })}>
          <Icon name="plus" width="18" height="18" /> Add
        </button>
      </div>

      {upcoming.length === 0 && (
        <div className="empty">
          <span className="big-emoji">🗓️</span>
          No upcoming events. Add appointments, trips, or anything that takes up time.
        </div>
      )}
      <div className="task-list">{upcoming.map(row)}</div>

      {past.length > 0 && (
        <div className="section">
          <button className="section-title" onClick={() => setShowPast((s) => !s)}>
            {showPast ? '▾' : '▸'} Past · {past.length}
          </button>
          {showPast && <div className="task-list">{past.map(row)}</div>}
        </div>
      )}

      {editing && <EventEditor event={editing.new ? null : editing} onClose={() => setEditing(null)} />}
      {open && !editing && (
        <EventDetail
          event={open}
          onClose={() => setOpenId(null)}
          onEdit={() => {
            setEditing(open)
            setOpenId(null)
          }}
        />
      )}
    </div>
  )
}
