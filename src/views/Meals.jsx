import { useState } from 'react'
import RecipeEditor from '../components/RecipeEditor.jsx'
import { Icon, Segmented, Sheet, useToast } from '../components/ui.jsx'
import { formatDay } from '../lib/dates.js'
import { MEAL_SLOTS, combineAmounts, findShoppingTask, groceryList, nutritionOn, planDays, plannedCalories } from '../lib/meals.js'
import { durationLabel } from '../lib/model.js'
import { hasPlus } from '../lib/plus.js'
import { useStore } from '../store.jsx'

const SECTIONS = [
  { id: 'plan', label: 'Plan' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'groceries', label: 'Groceries' },
]

function RecipePicker({ day, slot, onClose, onNewRecipe }) {
  const { state, today, actions } = useStore()
  const current = state.mealPlan[day]?.[slot]
  // Recipes for this meal first, then the rest.
  const sorted = [...state.recipes].sort(
    (a, b) => (b.meal === slot || b.meal === 'any') - (a.meal === slot || a.meal === 'any') || a.name.localeCompare(b.name),
  )
  const pick = (id) => {
    actions.setMeal(day, slot, id)
    onClose()
  }
  return (
    <Sheet title={`${formatDay(day, today)} · ${slot === 'lunch' ? 'Lunch' : 'Dinner'}`} onClose={onClose}>
      <div className="stack">
        {sorted.length > 0 && (
          <div className="menu">
            {sorted.map((r) => (
              <button key={r.id} onClick={() => pick(r.id)}>
                <span style={{ width: 20 }}>{current === r.id ? '●' : ''}</span>
                <span style={{ flex: 1 }}>{r.name}</span>
                {r.minutes > 0 && <span className="small muted">{durationLabel(r.minutes)}</span>}
              </button>
            ))}
          </div>
        )}
        <button className="btn" onClick={onNewRecipe}>
          + New recipe
        </button>
        {current && (
          <button className="btn ghost" onClick={() => pick(null)}>
            Clear this meal
          </button>
        )}
      </div>
    </Sheet>
  )
}

function Plan({ onNewRecipe }) {
  const { state, today, actions } = useStore()
  const toast = useToast()
  const [picking, setPicking] = useState(null)
  const byId = new Map(state.recipes.map((r) => [r.id, r]))

  return (
    <div className="stack">
      {state.recipes.length > 0 ? (
        <button
          className="btn primary"
          onClick={() => {
            actions.suggestMeals()
            toast('Filled the empty meals')
          }}
        >
          <Icon name="sparkle" width="18" height="18" /> Suggest meals for empty slots
        </button>
      ) : (
        <div className="empty card">
          <span className="big-emoji">🍲</span>
          <b>Add a few recipes you like</b>
          <p className="small">Then I can plan your meals and make the grocery list.</p>
          <button className="btn primary" onClick={() => onNewRecipe()}>
            + New recipe
          </button>
        </div>
      )}
      {planDays(today).map((day) => (
        <section key={day} className={`week-day ${day === today ? 'today' : ''}`}>
          <header>
            <h3>{formatDay(day, today)}</h3>
            {nutritionOn(state) && plannedCalories(state, day) != null && (
              <span className="small muted">~{plannedCalories(state, day).toLocaleString()} cal planned</span>
            )}
            {day === today && <CaloriesToday />}
          </header>
          <div className="stack" style={{ gap: 6 }}>
            {MEAL_SLOTS.map((slot) => {
              const recipe = byId.get(state.mealPlan[day]?.[slot.id])
              return (
                <button key={slot.id} className="meal-slot" onClick={() => setPicking({ day, slot: slot.id })}>
                  <span className="small muted" style={{ width: 56 }}>
                    {slot.label}
                  </span>
                  {recipe ? (
                    <span style={{ flex: 1, fontWeight: 650 }}>{recipe.name}</span>
                  ) : (
                    <span style={{ flex: 1 }} className="muted">
                      + add
                    </span>
                  )}
                  {recipe?.minutes > 0 && <span className="small muted">{durationLabel(recipe.minutes)}</span>}
                </button>
              )
            })}
          </div>
        </section>
      ))}
      {picking && (
        <RecipePicker
          {...picking}
          onClose={() => setPicking(null)}
          onNewRecipe={() => {
            setPicking(null)
            onNewRecipe(picking)
          }}
        />
      )}
    </div>
  )
}

function Recipes({ onEdit }) {
  const { state } = useStore()
  const sorted = [...state.recipes].sort((a, b) => a.name.localeCompare(b.name))
  return (
    <div className="stack">
      <button className="btn primary" onClick={() => onEdit(null)}>
        + New recipe
      </button>
      {sorted.length === 0 && <p className="muted small">Your saved recipes live here, ready to reuse any week.</p>}
      <div className="task-list">
        {sorted.map((r) => (
          <button key={r.id} className="task-item" onClick={() => onEdit(r)}>
            <span className="stripe" style={{ background: 'var(--event)' }} />
            <span className="body">
              <span className="title" style={{ display: 'block' }}>
                {r.name}
              </span>
              <span className="meta">
                <span>{r.meal === 'any' ? 'Lunch or dinner' : r.meal === 'lunch' ? 'Lunch' : 'Dinner'}</span>
                {r.minutes > 0 && <span>· {durationLabel(r.minutes)}</span>}
                {nutritionOn(state) && r.calories > 0 && <span>· {r.calories} cal</span>}
                <span>
                  · {r.ingredients.length} {r.ingredients.length === 1 ? 'ingredient' : 'ingredients'}
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function GroceryRow({ item, today }) {
  const { actions } = useStore()
  const toggle = (status) => actions.setGroceryStatus(item.key, item.status === status ? null : status)
  return (
    <div className={`task-item ${item.status ? 'done' : ''}`}>
      <button
        className={`check ${item.status === 'got' ? 'on' : ''}`}
        onClick={() => toggle('got')}
        aria-label={item.status === 'got' ? `Unmark ${item.name}` : `Got ${item.name}`}
        aria-pressed={item.status === 'got'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="body">
        <div className="title">
          {item.name}
          {item.amounts.length > 0 && <span className="muted" style={{ fontWeight: 500 }}> · {combineAmounts(item.amounts)}</span>}
        </div>
        <div className="meta">
          {item.status === 'have' && <span>Already have it</span>}
          {!item.status && item.recipes.length > 0 && (
            <span>
              {item.recipes.join(', ')}
              {item.firstDay && ` · ${formatDay(item.firstDay, today).toLowerCase()}`}
            </span>
          )}
        </div>
      </div>
      {item.extraId ? (
        <button className="icon-btn" aria-label={`Remove ${item.name}`} onClick={() => actions.removeGroceryExtra(item.extraId)}>
          ×
        </button>
      ) : (
        <button className={`chip ${item.status === 'have' ? 'on' : ''}`} onClick={() => toggle('have')} style={{ fontSize: '0.78rem', minHeight: 32, padding: '4px 10px' }}>
          Have it
        </button>
      )}
    </div>
  )
}

function Groceries() {
  const { state, today, schedule, actions } = useStore()
  const toast = useToast()
  const [text, setText] = useState('')
  const [showDone, setShowDone] = useState(false)
  const list = groceryList(state, today)
  const toGet = list.filter((i) => !i.status)
  const done = list.filter((i) => i.status)
  const trip = findShoppingTask(state.tasks)
  const tripDay = trip && schedule.nextDayForTask[trip.id]

  return (
    <div className="stack">
      <form
        className="quick-add"
        onSubmit={(e) => {
          e.preventDefault()
          if (!text.trim()) return
          actions.addGroceryExtra(text.trim())
          setText('')
        }}
      >
        <input placeholder="Add something else (coffee, paper towels…)" value={text} onChange={(e) => setText(e.target.value)} aria-label="Add grocery item" />
        <button className="btn primary" type="submit" disabled={!text.trim()}>
          Add
        </button>
      </form>

      {list.length === 0 ? (
        <div className="empty">
          <span className="big-emoji">🧺</span>
          Plan some meals and their ingredients show up here. Check off what you already have.
        </div>
      ) : (
        <>
          {toGet.length > 0 ? (
            <>
              <p className="section-title" style={{ margin: '8px 0 0' }}>
                To get · {toGet.length}
              </p>
              <p className="small muted" style={{ margin: 0 }}>
                Tap ✓ when you get it, or “Have it” if it’s already in the kitchen.
              </p>
              <div className="task-list">
                {toGet.map((item) => (
                  <GroceryRow key={item.key} item={item} today={today} />
                ))}
              </div>
              <button
                className="btn"
                onClick={() => {
                  actions.planShoppingTrip()
                  toast(trip ? 'Shopping trip updated' : 'Shopping trip added to your plan')
                }}
              >
                🛒 {trip ? `Shopping trip planned${tripDay ? ` · ${formatDay(tripDay, today)}` : ''}` : 'Add a shopping trip to my plan'}
              </button>
            </>
          ) : (
            <div className="empty card">
              <span className="big-emoji">✨</span>
              <b>You’re all set for the week’s meals.</b>
            </div>
          )}
          {done.length > 0 && (
            <div className="section">
              <button className="section-title" onClick={() => setShowDone((s) => !s)}>
                {showDone ? '▾' : '▸'} Got it or have it · {done.length}
              </button>
              {showDone && (
                <div className="task-list">
                  {done.map((item) => (
                    <GroceryRow key={item.key} item={item} today={today} />
                  ))}
                </div>
              )}
            </div>
          )}
          {done.length > 0 && (
            <button
              className="btn ghost small"
              onClick={() => {
                actions.clearGroceries()
                toast('Fresh list')
              }}
            >
              Start a fresh list
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default function Meals() {
  const [section, setSection] = useState('plan')
  const [editing, setEditing] = useState(null) // { recipe } or { recipe: null, slot }
  const { state, today, actions } = useStore()
  const toGet = groceryList(state, today).filter((i) => !i.status).length

  return (
    <div className="stack">
      <div>
        <h1>Meals</h1>
        <p className="muted small" style={{ margin: 0 }}>
          Plan lunches and dinners; the grocery list builds itself.
        </p>
      </div>
      <Segmented
        options={SECTIONS.map((s) =>
          s.id === 'groceries' && toGet
            ? {
                ...s,
                label: (
                  <>
                    Groceries <span className="count">{toGet}</span>
                  </>
                ),
              }
            : s,
        )}
        value={section}
        onChange={setSection}
      />
      {section === 'plan' && <Plan onNewRecipe={(slot) => setEditing({ recipe: null, slot })} />}
      {section === 'recipes' && <Recipes onEdit={(recipe) => setEditing({ recipe })} />}
      {section === 'groceries' && <Groceries />}
      {editing && (
        <RecipeEditor
          recipe={editing.recipe}
          onClose={() => setEditing(null)}
          onSaved={(recipe) => editing.slot && actions.setMeal(editing.slot.day, editing.slot.slot, recipe.id)}
        />
      )}
    </div>
  )
}

/** Plus: today's calories from Apple Health (eaten and burned), against the target if set. */
function CaloriesToday() {
  const { state, today } = useStore()
  const h = state.health?.[today]
  if (!hasPlus(state) || !h || (h.eatenKcal == null && h.activeKcal == null)) return null
  const target = state.settings.calorieTarget
  const eaten = Math.round(h.eatenKcal || 0)
  return (
    <span className="small muted">
      {h.eatenKcal != null && `🍽 ${eaten.toLocaleString()}${target ? ` of ${Number(target).toLocaleString()}` : ''} eaten`}
      {h.eatenKcal != null && h.activeKcal != null && ' · '}
      {h.activeKcal != null && `🔥 ${Math.round(h.activeKcal).toLocaleString()} burned`}
    </span>
  )
}
