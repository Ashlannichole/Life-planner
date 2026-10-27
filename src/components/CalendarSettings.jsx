import { useEffect, useState } from 'react'
import { askNative, hasNativeFeature, setDeviceSettings } from '../lib/native.js'
import { useStore } from '../store.jsx'
import { Toggle, useToast } from './ui.jsx'

/** iPhone app: two-way sync with the phone's calendars. Which calendars is a per-phone choice. */
export default function CalendarSettings({ device }) {
  const { state, actions } = useStore()
  const toast = useToast()
  const [calendars, setCalendars] = useState(null)
  const settings = device.calendar || {}
  const on = !!settings.on

  useEffect(() => {
    if (!on) return
    askNative({ type: 'calendar:list' }, 'calendar:list').then((m) => setCalendars(m?.calendars || []))
  }, [on])

  if (!hasNativeFeature('calendar')) return null

  const save = (fields) => setDeviceSettings({ calendar: { ...settings, ...fields } })

  const turnOn = async () => {
    const answer = await askNative({ type: 'calendar:enable' }, 'calendar:status', 60000)
    if (!answer?.granted) {
      toast('Calendar access is off for Sprout. Turn it on in the iPhone Settings app → Sprout → Calendars.')
      return
    }
    const list = await askNative({ type: 'calendar:list' }, 'calendar:list')
    const all = list?.calendars || []
    setCalendars(all)
    // Start with the person's own calendars; holiday and birthday ones are off (Sprout has its own).
    save({ on: true, ids: all.filter((c) => c.suggested !== false).map((c) => c.id), write: true })
    toast('📅 Calendar connected')
  }

  const turnOff = () => {
    save({ on: false })
    actions.clearCalendarEvents()
  }

  const toggleCalendar = (id, include) => {
    const ids = new Set(settings.ids || [])
    if (include) ids.add(id)
    else ids.delete(id)
    save({ ids: [...ids] })
  }

  const count = state.calendar?.events?.length || 0

  return (
    <div className="section">
      <p className="section-title">Calendar</p>
      <div className="card stack">
        <div className="row spread">
          <span>
            <b>Sync with my calendar</b>
            <br />
            <span className="small muted">Events from your calendar show up in Sprout and the plan works around them. Sprout’s events go into your calendar too.</span>
          </span>
          <Toggle on={on} onChange={(v) => (v ? turnOn() : turnOff())} label="Sync with my calendar" />
        </div>
        {on && (
          <>
            <div className="row spread">
              <span>
                Add Sprout’s events to my calendar
                <br />
                <span className="small muted">In a calendar called “Sprout”. Change them in Sprout and they update there.</span>
              </span>
              <Toggle on={settings.write !== false} onChange={(write) => save({ write })} label="Add Sprout’s events to my calendar" />
            </div>
            <p className="section-title" style={{ margin: '4px 0 0' }}>
              Show in Sprout
            </p>
            {calendars == null && <p className="small muted">Loading calendars…</p>}
            {calendars?.length === 0 && <p className="small muted">No calendars found on this phone.</p>}
            {calendars?.map((c) => (
              <div key={c.id} className="row spread">
                <span className="row" style={{ gap: 8 }}>
                  <span className="cal-dot" style={{ background: c.color || 'var(--muted)' }} aria-hidden="true" />
                  <span>
                    {c.title}
                    {c.account && <span className="small muted"> · {c.account}</span>}
                  </span>
                </span>
                <Toggle on={(settings.ids || []).includes(c.id)} onChange={(v) => toggleCalendar(c.id, v)} label={`Show ${c.title}`} />
              </div>
            ))}
            <p className="small muted" style={{ margin: 0 }}>
              {count ? `${count} calendar ${count === 1 ? 'event' : 'events'} in your plan.` : 'Nothing from your calendar yet.'} Syncs each time you open Sprout.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
