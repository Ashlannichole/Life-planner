import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useState } from 'react'
import ItemMenu from '../components/ItemMenu.jsx'
import { Icon, useToast } from '../components/ui.jsx'
import { addDays, formatDay, formatMinutes, formatShortDate, formatTime, weekDays } from '../lib/dates.js'
import { categoryById } from '../lib/model.js'
import { eventsOnDay } from '../lib/scheduler.js'
import { useStore } from '../store.jsx'

function Chip({ item, onOpen }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.key, data: item })
  const cat = categoryById(item.category)
  return (
    <button
      ref={setNodeRef}
      className={`week-chip ${item.type} ${isDragging ? 'is-dragging' : ''}`}
      onClick={onOpen}
      {...attributes}
      {...listeners}
    >
      {cat ? cat.icon : ''} {item.title}
    </button>
  )
}

function DayCard({ dayKey, today, children, fill, planned, droppable }) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey, disabled: !droppable })
  const past = dayKey < today
  return (
    <section ref={setNodeRef} className={`week-day ${dayKey === today ? 'today' : ''} ${past ? 'past' : ''} ${isOver ? 'over' : ''}`}>
      <header>
        <h3>{formatDay(dayKey, today)}</h3>
        {fill != null && (
          <span className="row small muted" title={`${formatMinutes(planned)} planned`}>
            <span className="fill-bar" aria-label={`Day is ${Math.round(fill * 100)}% full`}>
              <span style={{ width: `${Math.min(100, fill * 100)}%` }} />
            </span>
          </span>
        )}
      </header>
      {children}
    </section>
  )
}

export default function Week() {
  const { schedule, state, today, actions } = useStore()
  const toast = useToast()
  const [offset, setOffset] = useState(0)
  const [menuItem, setMenuItem] = useState(null)
  const [dragging, setDragging] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  // A rolling week starting today, so the view is always about what's ahead.
  const start = addDays(today, offset * 7)
  const days = weekDays(start)
  const byKey = new Map(schedule.days.map((d) => [d.key, d]))

  const onDragEnd = ({ active, over }) => {
    setDragging(null)
    if (!over) return
    const item = active.data.current
    if (over.id === item.day) return
    actions.moveToDay(item.key, over.id, item.day)
    toast(`Moved to ${formatDay(over.id, today)}`)
  }

  return (
    <div className="stack">
      <div className="row spread">
        <div>
          <h1>{offset === 0 ? 'Next 7 days' : 'The week after'}</h1>
          <p className="muted small" style={{ margin: 0 }}>
            {formatShortDate(start)} – {formatShortDate(addDays(start, 6))} · hold & drag to move things
          </p>
        </div>
        <div className="row">
          <button className="icon-btn" onClick={() => setOffset(0)} disabled={offset === 0} aria-label="Next 7 days">
            <Icon name="chevronLeft" />
          </button>
          <button className="icon-btn" onClick={() => setOffset(1)} disabled={offset === 1} aria-label="The week after">
            <Icon name="chevronRight" />
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => setDragging(active.data.current)}
        onDragCancel={() => setDragging(null)}
        onDragEnd={onDragEnd}
      >
        <div className="week-grid">
          {days.map((key) => {
            const planned = byKey.get(key)
            const events = planned ? planned.events : eventsOnDay(state.events, key)
            const done = key === today ? state.completions.filter((c) => c.date === key) : []
            // `used` includes anything already done today.
            const fill = planned ? planned.used / Math.max(planned.freeMinutes, 1) : null
            return (
              <DayCard key={key} dayKey={key} today={today} fill={planned && planned.freeMinutes > 0 ? fill : null} planned={planned?.planned || 0} droppable={!!planned}>
                <div className="week-chips">
                  {events.map((e) => (
                    <span key={e.id} className="week-chip event">
                      {e.allDay || e.date !== key ? '' : `${formatTime(e.start)} `}
                      {e.title}
                    </span>
                  ))}
                  {['lunch', 'dinner'].map((slot) => {
                    const recipe = state.recipes.find((r) => r.id === state.mealPlan[key]?.[slot])
                    return (
                      recipe && (
                        <span key={slot} className="week-chip meal">
                          🍽 {recipe.name}
                        </span>
                      )
                    )
                  })}
                  {done.map((c) => (
                    <span key={c.id} className={`week-chip done ${c.type}`}>
                      ✓ {c.title}
                    </span>
                  ))}
                  {planned?.items.map((item) => (
                    <Chip key={item.key} item={item} onOpen={() => setMenuItem(item)} />
                  ))}
                  {!events.length && !done.length && !planned?.items.length && (
                    <span className="muted small">
                      {planned?.allDayBusy ? 'Busy day — nothing extra' : planned && planned.capacity <= 0 ? 'A rest day' : 'Open'}
                    </span>
                  )}
                </div>
              </DayCard>
            )
          })}
        </div>
        <DragOverlay>
          {dragging && <span className={`week-chip drag-overlay-chip ${dragging.type}`}>{dragging.title}</span>}
        </DragOverlay>
      </DndContext>

      {schedule.unscheduled.length > 0 && offset === 1 && (
        <p className="muted small" style={{ textAlign: 'center' }}>
          {schedule.unscheduled.length} more {schedule.unscheduled.length === 1 ? 'task is' : 'tasks are'} waiting for a later week.
        </p>
      )}

      {(Object.keys(state.pins).length > 0 || Object.keys(state.dayOrder).length > 0) && (
        <button
          className="btn ghost"
          onClick={() => {
            actions.replan()
            toast('Fresh plan made')
          }}
        >
          Undo my moves and re-plan
        </button>
      )}

      {menuItem && <ItemMenu item={menuItem} onClose={() => setMenuItem(null)} />}
    </div>
  )
}
