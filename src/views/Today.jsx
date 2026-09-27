import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import CheckButton from '../components/CheckButton.jsx'
import ItemMenu from '../components/ItemMenu.jsx'
import Plant from '../components/Plant.jsx'
import { Icon, useToast } from '../components/ui.jsx'
import { WEEKDAY_LONG, formatShortDate, formatTime, weekday } from '../lib/dates.js'
import { categoryById, durationLabel } from '../lib/model.js'
import { stageFor, stageProgress } from '../lib/plant.js'
import { useStore } from '../store.jsx'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function ItemMeta({ item }) {
  const cat = categoryById(item.category)
  return (
    <span className="meta">
      <span>{durationLabel(item.minutes)}</span>
      {cat && <span>· {cat.icon} {cat.label}</span>}
      {item.type === 'want' && <span className="tag want">fun</span>}
      {item.eventId && <span className="tag event">prep</span>}
    </span>
  )
}

function SortableItem({ item, onCheck, onOpen, leaving }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.key,
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`task-item ${item.type} ${isDragging ? 'dragging' : ''} ${leaving ? 'leaving' : ''}`}
    >
      <CheckButton checked={false} onCheck={onCheck} label={`Done: ${item.title}`} />
      <button className="body" onClick={onOpen}>
        <div className="title">{item.title}</div>
        <ItemMeta item={item} />
      </button>
      <span ref={setActivatorNodeRef} className="drag-handle" {...attributes} {...listeners} aria-label="Reorder">
        <Icon name="grip" width="20" height="20" />
      </span>
    </div>
  )
}

export default function Today({ onFocus, onNavigate, onRecap }) {
  const { state, schedule, today, actions } = useStore()
  const toast = useToast()
  const [menuItem, setMenuItem] = useState(null)
  const [leaving, setLeaving] = useState(() => new Set())
  const day = schedule.days[0]
  const items = day.items
  const doneToday = state.completions.filter((c) => c.date === today)
  const plant = state.plant.current
  const isSunday = weekday(today) === 0

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const check = (item) => {
    // Let the check animation play before the item leaves the list.
    setLeaving((s) => new Set(s).add(item.key))
    setTimeout(() => {
      actions.complete(item)
      setLeaving((s) => {
        const next = new Set(s)
        next.delete(item.key)
        return next
      })
    }, 450)
  }

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const keys = items.map((i) => i.key)
    actions.setDayOrder(today, arrayMove(keys, keys.indexOf(active.id), keys.indexOf(over.id)))
  }

  const pullIn = () => {
    const next = schedule.days.slice(1).flatMap((d) => d.items)[0] || schedule.unscheduled[0]
    if (!next) {
      toast('Your list is empty — add something in Tasks')
      return
    }
    actions.moveToDay(next.key, today)
    toast(`Pulled in: ${next.title}`)
  }

  let lastPart = null

  return (
    <div className="stack">
      <div className="hero">
        <div>
          <p className="muted small" style={{ margin: 0 }}>
            {WEEKDAY_LONG[weekday(today)]}, {formatShortDate(today)}
          </p>
          <h1>{greeting()}</h1>
        </div>
        <button className="mini-plant" onClick={() => onNavigate('garden')} aria-label="Open garden">
          <Plant typeId={plant.typeId} potId={plant.potId} water={plant.water} size={64} />
        </button>
      </div>

      {isSunday && state.settings.recapSeen !== today && (
        <button className="banner" onClick={onRecap}>
          <span style={{ fontSize: '1.6rem' }}>🌼</span>
          <span>
            <b>Your week in bloom</b>
            <br />
            <span className="muted small">See everything you did this week</span>
          </span>
        </button>
      )}

      {day.events.length > 0 && (
        <div className="stack" style={{ gap: 8 }}>
          {day.events.map((e) => (
            <div className="event-pill" key={e.id}>
              <span className="time">{e.allDay || e.date !== today ? 'All day' : `${formatTime(e.start)}–${formatTime(e.end)}`}</span>
              <span style={{ fontWeight: 650 }}>{e.title}</span>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 ? (
        <>
          <button className="btn primary big" onClick={() => onFocus()}>
            <Icon name="play" width="20" height="20" /> Start focus mode
          </button>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            {items.length} {items.length === 1 ? 'thing' : 'things'} for today, in a suggested order.
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.key)} strategy={verticalListSortingStrategy}>
              <div className="task-list">
                {items.map((item) => {
                  const showPart = !state.dayOrder[today] && item.part !== lastPart
                  lastPart = item.part
                  return (
                    <div key={item.key} className="stack" style={{ gap: 6 }}>
                      {showPart && <div className="part-label">{item.part[0].toUpperCase() + item.part.slice(1)}</div>}
                      <SortableItem
                        item={item}
                        leaving={leaving.has(item.key)}
                        onCheck={() => check(item)}
                        onOpen={() => setMenuItem(item)}
                      />
                    </div>
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        </>
      ) : (
        <div className="empty card">
          <span className="big-emoji">{doneToday.length ? '🌿' : '☁️'}</span>
          <b>{doneToday.length ? 'That’s everything for today.' : 'Nothing planned for today.'}</b>
          <p className="small">Rest counts too. If you have some energy, you can pull something in.</p>
          <button className="btn" onClick={pullIn}>
            <Icon name="plus" width="18" height="18" /> Pull in a task
          </button>
        </div>
      )}

      {items.length > 0 && (
        <button className="btn ghost" onClick={pullIn}>
          Got extra time? Pull in one more
        </button>
      )}

      {doneToday.length > 0 && (
        <div className="section">
          <p className="section-title">Done today · {doneToday.length}</p>
          <div className="task-list">
            {doneToday.map((c) => (
              <div key={c.id} className={`task-item done ${c.type}`}>
                <CheckButton checked onCheck={() => actions.uncomplete(c.id)} label={`Undo: ${c.title}`} />
                <div className="body">
                  <div className="title">{c.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="muted small" style={{ textAlign: 'center', marginTop: 12 }}>
        {stageFor(plant.water).label} · {Math.round(stageProgress(plant.water) * 100)}% to the next stage
      </p>

      {menuItem && <ItemMenu item={menuItem} onClose={() => setMenuItem(null)} onFocus={onFocus} />}
    </div>
  )
}
