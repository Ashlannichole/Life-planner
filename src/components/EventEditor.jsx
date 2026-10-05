import { useState } from 'react'
import { formatShortDate, todayKey } from '../lib/dates.js'
import { uid } from '../lib/model.js'
import { allPrepTemplates, fitDaysBefore, prepDates, templateWithItems } from '../lib/prep.js'
import { useStore } from '../store.jsx'
import PrepAdder from './PrepAdder.jsx'
import { Sheet, Toggle, useToast } from './ui.jsx'

export default function EventEditor({ event, onClose }) {
  const { state, actions } = useStore()
  const toast = useToast()
  const [draft, setDraft] = useState(
    () =>
      event || {
        title: '',
        date: todayKey(),
        endDate: null,
        allDay: false,
        start: '18:00',
        end: '19:00',
        prepTemplateId: null,
      },
  )
  const [multiDay, setMultiDay] = useState(!!event?.endDate)
  const [picked, setPicked] = useState(() => new Set())
  // Prep added on top of the template's own items; `remember` also saves it into the template.
  const [extras, setExtras] = useState([])
  const set = (fields) => setDraft((d) => ({ ...d, ...fields }))
  const templates = allPrepTemplates(state)
  const template = templates.find((t) => t.id === draft.prepTemplateId)

  const chooseTemplate = (id) => {
    const tpl = templates.find((t) => t.id === id)
    set({ prepTemplateId: id, title: draft.title || tpl?.name || '' })
    setPicked(new Set(tpl ? tpl.items.map((i) => i.id) : []))
    setExtras([])
    if (tpl?.id === 'trip') {
      setMultiDay(true)
      set({ prepTemplateId: id, allDay: true, title: draft.title || 'Trip' })
    }
  }

  const valid = draft.title.trim() && draft.date && (!multiDay || !draft.endDate || draft.endDate >= draft.date)

  const save = (e) => {
    e.preventDefault()
    if (!valid) return
    const clean = {
      ...draft,
      title: draft.title.trim(),
      endDate: multiDay && draft.endDate && draft.endDate > draft.date ? draft.endDate : null,
    }
    if (event) {
      actions.updateEvent(event.id, clean)
      toast('Event updated — plan rebalanced')
    } else {
      const fit = (i) => ({ ...i, daysBefore: fitDaysBefore(todayKey(), clean.date, i.daysBefore) })
      const items = template ? [...template.items.filter((i) => picked.has(i.id)), ...extras.map(fit)] : []
      const remembered = extras.filter((i) => i.remember)
      if (template && remembered.length) actions.savePrepTemplate(templateWithItems(template, remembered))
      actions.addEvent(clean, items, template?.packing || [])
      toast(items.length ? `Added with ${items.length} prep tasks` : 'Event added — plan rebalanced')
    }
    onClose()
  }

  return (
    <Sheet title={event ? 'Edit event' : 'New event'} onClose={onClose}>
      <form className="stack" onSubmit={save}>
        {!event && (
          <div className="field">
            <span className="label">Type</span>
            <div className="chips">
              <button type="button" className={`chip ${!draft.prepTemplateId ? 'on' : ''}`} onClick={() => chooseTemplate(null)}>
                Plain event
              </button>
              {templates.map((t) => (
                <button type="button" key={t.id} className={`chip ${draft.prepTemplateId === t.id ? 'on' : ''}`} onClick={() => chooseTemplate(t.id)}>
                  {t.id === 'trip' ? '✈️ ' : '📦 '}
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <input className="input" placeholder="Event name" value={draft.title} onChange={(e) => set({ title: e.target.value })} aria-label="Event name" autoFocus={!event} />
        <div className="field">
          <label htmlFor="ev-date">{multiDay ? 'Starts' : 'Date'}</label>
          <input id="ev-date" className="input" type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} />
        </div>
        <div className="row spread">
          <span>Several days</span>
          <Toggle on={multiDay} onChange={setMultiDay} label="Several days" />
        </div>
        {multiDay && (
          <div className="field">
            <label htmlFor="ev-end">Ends</label>
            <input id="ev-end" className="input" type="date" min={draft.date} value={draft.endDate || ''} onChange={(e) => set({ endDate: e.target.value })} />
          </div>
        )}
        <div className="row spread">
          <span>All day</span>
          <Toggle on={draft.allDay} onChange={(allDay) => set({ allDay })} label="All day" />
        </div>
        {!draft.allDay && (
          <div className="time-range">
            <input className="input" type="time" value={draft.start} onChange={(e) => set({ start: e.target.value })} aria-label="Start time" />
            <span className="muted">to</span>
            <input className="input" type="time" value={draft.end} onChange={(e) => set({ end: e.target.value })} aria-label="End time" />
          </div>
        )}

        {template && !event && (
          <div className="field">
            <span className="label">Prep tasks — scheduled backward from the event</span>
            <div className="menu">
              {template.items.map((item) => {
                const on = picked.has(item.id)
                const { deadline } = prepDates(draft.date, item.daysBefore)
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() =>
                      setPicked((s) => {
                        const next = new Set(s)
                        if (on) next.delete(item.id)
                        else next.add(item.id)
                        return next
                      })
                    }
                  >
                    <span style={{ width: 22 }}>{on ? '☑' : '☐'}</span>
                    <span style={{ flex: 1 }}>{item.title}</span>
                    <span className="small muted">by {formatShortDate(deadline)}</span>
                  </button>
                )
              })}
            </div>
            {extras.length > 0 && (
              <div className="menu">
                {extras.map((item) => (
                  <button type="button" key={item.id} onClick={() => setExtras((xs) => xs.filter((x) => x.id !== item.id))}>
                    <span style={{ width: 22 }}>☑</span>
                    <span style={{ flex: 1 }}>{item.title}</span>
                    <span className="small muted">by {formatShortDate(prepDates(draft.date, fitDaysBefore(todayKey(), draft.date, item.daysBefore)).deadline)}</span>
                  </button>
                ))}
              </div>
            )}
            <PrepAdder
              isTrip={template.id === 'trip' || multiDay}
              existingTitles={[...template.items, ...extras].map((i) => i.title)}
              templateName={template.name}
              onAdd={(items, remember) => setExtras((xs) => [...xs, ...items.map((i) => ({ ...i, id: uid(), remember }))])}
            />
            {template.packing?.length > 0 && <p className="small muted">A packing list will be attached too.</p>}
          </div>
        )}

        <button className="btn primary big" type="submit" disabled={!valid}>
          {event ? 'Save' : 'Add event'}
        </button>
      </form>
    </Sheet>
  )
}
