import { useState } from 'react'
import { ingredientsToText, nutritionOn, parseIngredients } from '../lib/meals.js'
import { DURATIONS, durationLabel, uid } from '../lib/model.js'
import { useStore } from '../store.jsx'
import { Chips, Sheet } from './ui.jsx'

const MEALS = [
  { id: 'dinner', label: 'Dinner' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'any', label: 'Either' },
]

export default function RecipeEditor({ recipe, onClose, onSaved }) {
  const { state, actions } = useStore()
  const [name, setName] = useState(recipe?.name || '')
  const [meal, setMeal] = useState(recipe?.meal || 'dinner')
  const [minutes, setMinutes] = useState(recipe?.minutes ?? 30)
  const [ingredients, setIngredients] = useState(recipe ? ingredientsToText(recipe.ingredients) : '')
  const [notes, setNotes] = useState(recipe?.notes || '')
  const [calories, setCalories] = useState(recipe?.calories ?? '')
  const showNutrition = nutritionOn(state)
  const [confirm, setConfirm] = useState(false)

  const save = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const saved = {
      id: recipe?.id || uid(),
      createdAt: recipe?.createdAt || Date.now(),
      name: name.trim(),
      meal,
      minutes,
      ingredients: parseIngredients(ingredients),
      notes: notes.trim(),
      calories: calories === '' ? null : Math.max(0, Math.round(Number(calories)) || 0) || null,
    }
    actions.saveRecipe(saved)
    if (!recipe) onSaved?.(saved)
    onClose()
  }

  return (
    <Sheet title={recipe ? 'Edit recipe' : 'New recipe'} onClose={onClose}>
      <form className="stack" onSubmit={save}>
        <input className="input" placeholder="e.g. Sheet-pan tacos" value={name} onChange={(e) => setName(e.target.value)} aria-label="Recipe name" autoFocus={!recipe} />
        <div className="field">
          <span className="label">Usually for</span>
          <Chips options={MEALS} value={meal} onChange={setMeal} />
        </div>
        <div className="field">
          <span className="label">Cooking time (counts toward that day’s plan)</span>
          <Chips
            options={[{ id: 0, label: 'No cooking' }, ...DURATIONS.filter((m) => m > 5).map((m) => ({ id: m, label: durationLabel(m) }))]}
            value={minutes}
            onChange={setMinutes}
          />
        </div>
        <div className="field">
          <label htmlFor="ingredients">Ingredients, one per line</label>
          <textarea
            id="ingredients"
            className="input"
            rows={7}
            placeholder={'1 lb ground beef\n1 onion\n8 tortillas\nsalsa'}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
        </div>
        {showNutrition && (
          <div className="field">
            <label htmlFor="calories">Calories per serving (optional)</label>
            <input
              id="calories"
              className="input"
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="e.g. 650"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>
        )}
        <div className="field">
          <label htmlFor="notes">Notes or link (optional)</label>
          <textarea id="notes" className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button className="btn primary big" type="submit" disabled={!name.trim()}>
          {recipe ? 'Save' : 'Add recipe'}
        </button>
        {recipe &&
          (confirm ? (
            <button
              type="button"
              className="btn ghost danger"
              onClick={() => {
                actions.deleteRecipe(recipe.id)
                onClose()
              }}
            >
              Tap again to delete (also removes it from the plan)
            </button>
          ) : (
            <button type="button" className="btn ghost danger" onClick={() => setConfirm(true)}>
              Delete recipe
            </button>
          ))}
      </form>
    </Sheet>
  )
}
