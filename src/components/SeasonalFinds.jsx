import { useState } from 'react'
import { PLANT_TYPES, POTS, monthName, plantType, seasonalProgress } from '../lib/plant.js'
import { hasPlus } from '../lib/plus.js'
import { seasonFor } from '../lib/seasons.js'
import { useStore } from '../store.jsx'
import Plant from './Plant.jsx'
import PlusSheet from './PlusSheet.jsx'

/** Plus: this month's rare plants, on theme with the calendar, and how close they are. */
export default function SeasonalFinds() {
  const { state, today } = useStore()
  const [plusOpen, setPlusOpen] = useState(false)
  const plus = hasPlus(state)
  const { monthName: month, done, finds, next } = seasonalProgress(state, today)
  const season = seasonFor(today)
  if (!finds.length) return null

  return (
    <div className="card stack seasonal-finds">
      <div className="row spread">
        <p className="section-title" style={{ margin: 0 }}>
          {season.emoji} {month}’s rare finds
        </p>
        {!plus && <span className="plus-badge">Plus</span>}
      </div>
      <div className="seasonal-row">
        {finds.map((f) => (
          <div key={f.id} className={`seasonal-find ${f.found ? 'found' : 'hidden'}`}>
            {f.kind === 'plant' ? (
              <Plant typeId={f.id} potId="terracotta" stage={5} size={64} />
            ) : (
              <Plant typeId="sunflower" potId={f.id} stage={0} size={64} />
            )}
            <div className="small">
              <b>{f.found ? f.name : '???'}</b>
            </div>
            <div className="tiny muted">{f.found ? 'Found!' : `${Math.max(0, f.at - done)} more`}</div>
          </div>
        ))}
      </div>
      {plus ? (
        <>
          {next && (
            <div className="progress" aria-label={`${done} of ${next.at} things done this month`}>
              <span style={{ width: `${Math.min(100, (done / next.at) * 100)}%` }} />
            </div>
          )}
          <p className="small muted" style={{ margin: 0 }}>
            {next
              ? `${done} ${done === 1 ? 'thing' : 'things'} done in ${month}. Finish ${next.at - done} more to find the next one. They only turn up in ${month}, and you keep them forever.`
              : `You found everything ${month} had! Next month brings new ones.`}
          </p>
        </>
      ) : (
        <>
          <p className="small muted" style={{ margin: 0 }}>
            Every month hides its own rare plants: poisonous ones in October, holly and a little tree in December. Finish things that month to find them.
          </p>
          <button className="btn small" onClick={() => setPlusOpen(true)}>
            ✨ Seasonal plants come with Plus
          </button>
        </>
      )}
      {plusOpen && <PlusSheet onClose={() => setPlusOpen(false)} />}
    </div>
  )
}

/** Every seasonal plant and pot, by month: found ones in color, the rest as silhouettes. */
export function SeasonalCollection() {
  const { state } = useStore()
  const { unlockedPlants, unlockedPots } = state.plant
  const items = [
    ...PLANT_TYPES.filter((p) => p.season).map((p) => ({ ...p, kind: 'plant', found: unlockedPlants.includes(p.id) })),
    ...POTS.filter((p) => p.season).map((p) => ({ ...p, kind: 'pot', found: unlockedPots.includes(p.id) })),
  ].sort((a, b) => a.season - b.season)
  return (
    <div className="garden-grid">
      {items.map((p) => (
        <div key={p.id} className={`garden-cell seasonal-find ${p.found ? 'found' : 'hidden'}`} title={p.found ? plantType(p.id).note || p.name : undefined}>
          {p.kind === 'plant' ? <Plant typeId={p.id} potId="terracotta" stage={5} size={56} /> : <Plant typeId="sunflower" potId={p.id} stage={0} size={56} />}
          <div>{p.found ? p.name : monthName(p.season)}</div>
        </div>
      ))}
    </div>
  )
}
