import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import CheckButton from '../components/CheckButton.jsx'
import HolidayCard from '../components/HolidayCard.jsx'
import ItemMenu from '../components/ItemMenu.jsx'
import TaskEditor from '../components/TaskEditor.jsx'
import Plant from '../components/Plant.jsx'
import BirthdayAsk from '../components/BirthdayAsk.jsx'
import WelcomeBack from '../components/WelcomeBack.jsx'
import HealthCard from '../components/HealthCard.jsx'
import BrainDumpSheet from '../components/BrainDumpSheet.jsx'
import { Garland, Peekers, useDecor } from '../components/ThemeDecor.jsx'
import { Icon, useToast } from '../components/ui.jsx'
import { WEEKDAY_LONG, addDays, diffDays, formatShortDate, formatTime, weekday } from '../lib/dates.js'
import { categoryById, durationLabel } from '../lib/model.js'
import { stageFor, stageProgress } from '../lib/plant.js'
import { holidaysBetween, holidaysOn } from '../lib/holidays.js'
import { hasPlus } from '../lib/plus.js'
import { isMyBirthday, themeFor } from '../lib/seasons.js'
import { MEAL_SLOTS } from '../lib/meals.js'
import { stepProgress } from '../lib/steps.js'
import { useStore } from '../store.jsx'

/** Plus holiday themes: "12 days until Halloween", or "Happy Halloween!" on the day. */
function countdown(theme, today) {
  if (!theme?.holidayId) return null
  const onTheDay = holidaysOn(today).find((h) => !h.specialId)
  const next = holidaysBetween(today, addDays(today, 70)).find((h) => h.id === theme.holidayId)
  if (!next || next.date === today) return onTheDay ? `${onTheDay.emoji} Happy ${onTheDay.name}!` : null
  const days = diffDays(today, next.date)
  return `${theme.emoji} ${days === 1 ? `${next.name} is tomorrow!` : `${days} days until ${next.name}`}`
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function ItemMeta({ item }) {
  const { state } = useStore()
  const cat = categoryById(item.category)
  const steps = stepProgress(state.tasks.find((t) => t.id === item.taskId))
  return (
    <span className="meta">
      <span>{durationLabel(item.minutes)}</span>
      {steps && (
        <span className="tag steps">
          ✂️ {steps.done}/{steps.total}
        </span>
      )}
      {cat && <span>· {cat.icon} {cat.label}</span>}
      {item.type === 'want' && <span className="tag want">fun</span>}
      {item.eventId && <span className="tag event">prep</span>}
    </span>
  )
}

function TaskCard({ item, onCheck, onOpen, className = '', handleRef, handleProps }) {
  return (
    <div className={`task-item ${item.type} ${className}`}>
      <CheckButton checked={false} onCheck={onCheck} label={`Done: ${item.title}`} />
      <button className="body" onClick={onOpen}>
        <div className="title">{item.title}</div>
        <ItemMeta item={item} />
      </button>
      <span ref={handleRef} className="drag-handle" {...handleProps} aria-label="Reorder">
        <Icon name="grip" width="20" height="20" />
      </span>
    </div>
  )
}

/**
 * One row of today's list. The sortable transform goes on this wrapper, not on
 * the card, so the card's own enter/leave transition never fights the drag.
 * The part-of-day label lives inside it so it travels with its task.
 */
function SortableItem({ item, label, onCheck, onOpen, leaving }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.key,
  })
  return (
    <div
      ref={setNodeRef}
      className={`sortable-row ${isDragging ? 'placeholder' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      {label && <div className="part-label">{label}</div>}
      <TaskCard
        item={item}
        onCheck={onCheck}
        onOpen={onOpen}
        className={leaving ? 'leaving' : ''}
        handleRef={setActivatorNodeRef}
        handleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

// Today's list only ever reorders up and down.
const verticalOnly = ({ transform }) => ({ ...transform, x: 0 })

export default function Today({ onFocus, onNavigate, onRecap }) {
  const { state, schedule, today, actions } = useStore()
  const toast = useToast()
  const [menuItem, setMenuItem] = useState(null)
  const [adding, setAdding] = useState(false)
  const [dumping, setDumping] = useState(false)
  const [leaving, setLeaving] = useState(() => new Set())
  const day = schedule.days[0]
  const plus = hasPlus(state)
  const items = day.items
  const doneToday = state.completions.filter((c) => c.date === today)
  const plant = state.plant.current
  const isSunday = weekday(today) === 0
  // Today's holidays (if shown) birthdays and anniversaries (always): labels only, they don't take up time.
  const holidayTheme = useDecor()
  const birthday = isMyBirthday(today, state.specialDays)
  const countdownText = countdown(holidayTheme, today)
  const todaysHolidays = holidaysOn(today, state.specialDays).filter((h) => h.specialId || state.settings.showHolidays !== false)

  // Pointer events cover mouse, pen and touch; the grip handle has touch-action: none, so a
  // finger on it drags straight away instead of scrolling the page.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const [dragging, setDragging] = useState(null)

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
    setDragging(null)
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
      <Garland theme={holidayTheme} />
      <div className="hero">
        <div>
          <p className="muted small" style={{ margin: 0 }}>
            {WEEKDAY_LONG[weekday(today)]}, {formatShortDate(today)}
            {state.settings.seasonalTheme && hasPlus(state) ? ` ${themeFor(today, state.specialDays).emoji}` : ''}
          </p>
          <h1>{birthday ? 'Happy birthday! 🎂' : greeting()}</h1>
          {countdownText && <span className="theme-countdown">{countdownText}</span>}
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

      <Peekers theme={holidayTheme} />
      {day.bedDay && (
        <div className="card bed-card stack" style={{ gap: 8 }}>
          <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
            <span className="holiday-emoji" aria-hidden="true">
              🛏️
            </span>
            <div>
              <b>Bed day. Rest is on the plan.</b>
              <p className="small muted" style={{ margin: '2px 0 0' }}>
                {items.length
                  ? `Just ${items.length === 1 ? 'one thing' : `${items.length} things`} you can do lying down. Everything else waits, nothing goes overdue.`
                  : 'Nothing else today. Everything waits for you, nothing goes overdue. 💤'}
              </p>
            </div>
          </div>
          <div className="chips">
            <button
              className="chip on"
              onClick={() => {
                actions.setEnergy(today, null)
                toast('☀️ Up and about! Your full day is back')
              }}
            >
              ☀️ I’m up! Show my full day
            </button>
            <button
              className="chip"
              onClick={() => {
                actions.setEnergy(today, 'low')
                toast('🌙 Up, but taking it easy')
              }}
            >
              🌙 Up, but keep it light
            </button>
          </div>
        </div>
      )}
      <WelcomeBack items={items} onFocus={onFocus} />
      <HealthCard day={day} />
      <BirthdayAsk />
      <HolidayCard />

      {todaysHolidays.length > 0 && (
        <div className="stack" style={{ gap: 8 }}>
          {todaysHolidays.map((h) => (
            <div className="event-pill holiday-pill" key={h.key}>
              <span style={{ fontSize: '1.2rem' }}>{h.emoji}</span>
              <span style={{ fontWeight: 650 }}>
                {h.name}
                {h.detail ? <span className="small muted"> · {h.detail}</span> : null}
              </span>
            </div>
          ))}
        </div>
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

      {MEAL_SLOTS.some((s) => state.mealPlan[today]?.[s.id]) && (
        <button className="event-pill meal-pill" onClick={() => onNavigate('meals')}>
          <span style={{ fontSize: '1.2rem' }}>🍽</span>
          <span className="stack" style={{ gap: 0 }}>
            {MEAL_SLOTS.map((s) => {
              const recipe = state.recipes.find((r) => r.id === state.mealPlan[today]?.[s.id])
              return (
                recipe && (
                  <span key={s.id}>
                    <span className="small muted">{s.label}:</span> <b>{recipe.name}</b>
                  </span>
                )
              )
            })}
          </span>
        </button>
      )}

      {day.workout && (
        <div className="event-pill meal-pill">
          <span style={{ fontSize: '1.2rem' }}>{day.workout.done ? '✅' : '🏋️'}</span>
          <span>
            <span className="small muted">Workout:</span> <b>{day.workout.title}</b>
            <span className="small muted"> · {day.workout.done ? 'done, nice!' : `${day.workout.minutes} min, planned around`}</span>
          </span>
        </div>
      )}

      {items.length > 0 ? (
        <>
          <button className="btn primary big" onClick={() => onFocus()}>
            <Icon name="play" width="20" height="20" /> Start focus mode
          </button>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            {items.length} {items.length === 1 ? 'thing' : 'things'} for today, in a suggested order.
            {day.lowEnergy && ' 🌙 Lighter day.'}
            {day.bedDay && ' 🛏️ All doable from bed.'}
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[verticalOnly]}
            onDragStart={({ active }) => setDragging(items.find((i) => i.key === active.id) || null)}
            onDragCancel={() => setDragging(null)}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={items.map((i) => i.key)} strategy={verticalListSortingStrategy}>
              <div className="task-list">
                {items.map((item) => {
                  const showPart = !state.dayOrder[today] && item.part !== lastPart
                  lastPart = item.part
                  return (
                    <SortableItem
                      key={item.key}
                      item={item}
                      label={showPart ? item.part[0].toUpperCase() + item.part.slice(1) : null}
                      leaving={leaving.has(item.key)}
                      onCheck={() => check(item)}
                      onOpen={() => setMenuItem(item)}
                    />
                  )
                })}
              </div>
            </SortableContext>
            <DragOverlay>{dragging && <TaskCard item={dragging} className="lifted" />}</DragOverlay>
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

      <div className="row wrap" style={{ justifyContent: 'center', gap: 4 }}>
        <button className="btn ghost" onClick={() => setAdding(true)}>
          <Icon name="plus" width="18" height="18" /> Add something for today
        </button>
        {plus && (
          <button className="btn ghost" onClick={() => setDumping(true)}>
            🧠 Brain dump
          </button>
        )}
        {items.length > 0 && (
          <button className="btn ghost" onClick={pullIn}>
            Extra time? Pull one in
          </button>
        )}
        {day.bedDay && (
          <button className="btn ghost" onClick={() => actions.setEnergy(today, null)}>
            🛏️ Bed day · undo
          </button>
        )}
        {day.lowEnergy ? (
          <button className="btn ghost" onClick={() => actions.setEnergy(today, null)}>
            🌙 Lighter day · undo
          </button>
        ) : (
          !day.bedDay && (
            <button
              className="btn ghost"
              onClick={() => {
                actions.setEnergy(today, 'low')
                toast('Taking it easy — today is lighter now')
              }}
            >
              Low energy? Lighten today
            </button>
          )
        )}
        {plus && !day.bedDay && !day.lowEnergy && (
          <button
            className="btn ghost"
            onClick={() => {
              actions.setEnergy(today, 'bed')
              toast('🛏️ Bed day', { label: 'Undo', onClick: () => actions.setEnergy(today, null) })
            }}
          >
            🛏️ Staying in bed today?
          </button>
        )}
      </div>

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

      {dumping && <BrainDumpSheet onClose={() => setDumping(false)} />}
      {adding && (
        <TaskEditor
          initialDate={today}
          onClose={() => setAdding(false)}
          onSaved={(t) => toast(`“${t.title}” is on today’s list`)}
        />
      )}
      {menuItem && <ItemMenu item={menuItem} onClose={() => setMenuItem(null)} onFocus={onFocus} />}
    </div>
  )
}
