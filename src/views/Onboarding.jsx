import { useState } from 'react'
import LibraryPicker from '../components/LibraryPicker.jsx'
import Plant from '../components/Plant.jsx'
import { todayKey } from '../lib/dates.js'
import { LIBRARY, tasksFromLibrary } from '../lib/library.js'
import { APP_NAME, makeTask, makeTemplate } from '../lib/model.js'
import { PLANT_TYPES } from '../lib/plant.js'
import { useStore } from '../store.jsx'

const FREE_TIME = [
  { id: 'wkmorning', label: 'Weekday mornings', hint: '7–8:30am', blocks: [{ days: [1, 2, 3, 4, 5], start: '07:00', end: '08:30' }] },
  { id: 'wklunch', label: 'Weekday lunch', hint: '12–1pm', blocks: [{ days: [1, 2, 3, 4, 5], start: '12:00', end: '13:00' }] },
  { id: 'wkevening', label: 'Weekday evenings', hint: '5:30–9pm', blocks: [{ days: [1, 2, 3, 4, 5], start: '17:30', end: '21:00' }] },
  { id: 'wkday', label: 'Weekdays, all day', hint: '9am–5pm', blocks: [{ days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' }] },
  { id: 'weekend', label: 'Weekends', hint: '10am–5pm', blocks: [{ days: [0, 6], start: '10:00', end: '17:00' }] },
]

// Fun ideas. Chores come from the starter library below them.
const SUGGESTIONS = [
  { title: 'Read a chapter', type: 'want', minutes: 30, repeat: 'none', category: 'hobby' },
  { title: 'Crochet', type: 'want', minutes: 60, repeat: 'none', category: 'hobby' },
  { title: 'Bake something', type: 'want', minutes: 90, repeat: 'none', category: 'hobby', preferredTime: 'weekend' },
  { title: 'Call a friend', type: 'want', minutes: 30, repeat: 'none', category: 'social' },
]

export default function Onboarding() {
  const { state, actions } = useStore()
  const [step, setStep] = useState(0)
  const [free, setFree] = useState(() => new Set(['wkevening', 'weekend']))
  const [tasks, setTasks] = useState([])
  const [typed, setTyped] = useState('')
  const [chores, setChores] = useState(() => new Set())
  const [plantId, setPlantId] = useState(state.plant.current.typeId)

  const finish = () => {
    const blocks = FREE_TIME.filter((f) => free.has(f.id)).flatMap((f) => f.blocks)
    const updates = {}
    if (blocks.length) {
      const template = makeTemplate('Normal', blocks)
      // Replace the untouched default schedule; keep any the user already made.
      updates.templates = [template, ...state.templates.filter((t) => t.name !== 'Normal')]
      updates.activeTemplateId = template.id
    }
    const picked = LIBRARY.filter((e) => chores.has(e.index))
    updates.tasks = [...state.tasks, ...tasks.map((t) => makeTask(t)), ...tasksFromLibrary(picked, todayKey())]
    updates.plant = { ...state.plant, current: { ...state.plant.current, typeId: plantId } }
    actions.finishOnboarding(updates)
  }

  const skip = () => actions.finishOnboarding()
  const has = (title) => tasks.some((t) => t.title === title)
  const toggleTask = (s) => setTasks((list) => (has(s.title) ? list.filter((t) => t.title !== s.title) : [...list, s]))

  const steps = [
    <>
      <div className="grow stack" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <Plant typeId="sunflower" potId="terracotta" water={10} size={140} />
        <h1>Hi, I’m {APP_NAME}.</h1>
        <p className="muted" style={{ maxWidth: 340 }}>
          Tell me everything you need <i>and</i> want to do. I’ll decide what to do and when — you can always tweak it.
          Nothing ever goes overdue here.
        </p>
      </div>
      <button className="btn primary big" onClick={() => setStep(1)}>
        Let’s set up (2 minutes)
      </button>
    </>,
    <>
      <div className="grow stack">
        <h1>When are you usually free?</h1>
        <p className="muted" style={{ margin: 0 }}>
          Pick all that fit. You can fine-tune this later or make a second schedule for busy seasons.
        </p>
        {FREE_TIME.map((f) => (
          <button
            key={f.id}
            className={`option ${free.has(f.id) ? 'on' : ''}`}
            aria-pressed={free.has(f.id)}
            onClick={() =>
              setFree((s) => {
                const next = new Set(s)
                if (next.has(f.id)) next.delete(f.id)
                else next.add(f.id)
                return next
              })
            }
          >
            <span style={{ flex: 1, fontWeight: 650 }}>{f.label}</span>
            <span className="small muted">{f.hint}</span>
          </button>
        ))}
      </div>
      <button className="btn primary big" onClick={() => setStep(2)}>
        Next
      </button>
    </>,
    <>
      <div className="grow stack">
        <h1>What’s on your mind?</h1>
        <p className="muted" style={{ margin: 0 }}>
          Tap what applies. I’ll figure out how often and when. Mix in fun things too; they get real time in your week.
        </p>
        <p className="section-title" style={{ margin: '8px 0 0' }}>
          🧶 Fun things
        </p>
        <div className="chips">
          {SUGGESTIONS.map((s) => (
            <button key={s.title} className={`chip ${s.type === 'want' ? 'want' : ''} ${has(s.title) ? 'on' : ''}`} onClick={() => toggleTask(s)}>
              {has(s.title) ? '✓ ' : '+ '}
              {s.title}
            </button>
          ))}
          {tasks
            .filter((t) => !SUGGESTIONS.some((s) => s.title === t.title))
            .map((t) => (
              <button key={t.title} className="chip on" onClick={() => toggleTask(t)}>
                ✓ {t.title}
              </button>
            ))}
        </div>
        <form
          className="quick-add"
          onSubmit={(e) => {
            e.preventDefault()
            const title = typed.trim()
            if (title && !has(title)) setTasks((l) => [...l, { title }])
            setTyped('')
          }}
        >
          <input placeholder="Add your own…" value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Add your own task" />
          <button className="btn" type="submit" disabled={!typed.trim()}>
            Add
          </button>
        </form>
        <div style={{ marginTop: 12 }}>
          <LibraryPicker selected={chores} onChange={setChores} />
        </div>
      </div>
      <button className="btn primary big onboarding-next" onClick={() => setStep(3)}>
        {tasks.length + chores.size ? `Next (${tasks.length + chores.size} added)` : 'Next'}
      </button>
    </>,
    <>
      <div className="grow stack">
        <h1>Pick your first plant</h1>
        <p className="muted" style={{ margin: 0 }}>
          Every task you finish waters it. It never wilts — on quiet days it just waits for you.
        </p>
        <div className="picker">
          {PLANT_TYPES.filter((p) => state.plant.unlockedPlants.includes(p.id)).map((p) => (
            <button key={p.id} className={plantId === p.id ? 'on' : ''} onClick={() => setPlantId(p.id)}>
              <Plant typeId={p.id} potId="terracotta" stage={5} size={80} />
              <div>{p.name}</div>
            </button>
          ))}
        </div>
      </div>
      <button className="btn primary big" onClick={finish}>
        Plan my week
      </button>
    </>,
  ]

  return (
    <div className="onboarding">
      <div className="row spread">
        <div className="dots" aria-label={`Step ${step + 1} of 4`}>
          {steps.map((_, i) => (
            <i key={i} className={i === step ? 'on' : ''} />
          ))}
        </div>
        <div className="row">
          {step > 0 && (
            <button className="btn ghost" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          <button className="btn ghost" onClick={skip}>
            Skip
          </button>
        </div>
      </div>
      {steps[step]}
    </div>
  )
}
