import { formatMinutes, formatShortDate } from '../lib/dates.js'
import { plantType } from '../lib/plant.js'
import { rangeRecap } from '../lib/recap.js'
import { useStore } from '../store.jsx'
import Plant from './Plant.jsx'
import { Sheet } from './ui.jsx'

/** A little journal page: what life looked like while this plant grew. */
export default function PlantMemory({ plant, current = false, onClose }) {
  const { state, today } = useStore()
  const end = current ? today : plant.completedAt
  const start = plant.startedAt || end
  const r = rangeRecap(state, start, end)
  const type = plantType(plant.typeId)

  return (
    <Sheet title={current ? `Your ${type.name.toLowerCase()} so far` : type.name} onClose={onClose}>
      <div className="stack" style={{ alignItems: 'stretch' }}>
        <div className="row" style={{ gap: 16 }}>
          <Plant typeId={plant.typeId} potId={plant.potId} water={current ? plant.water : undefined} stage={current ? undefined : 5} size={80} />
          <div>
            <p className="muted small" style={{ margin: 0 }}>
              {start === end ? formatShortDate(start) : `${formatShortDate(start)} – ${formatShortDate(end)}`}
            </p>
            <h3 style={{ marginTop: 4 }}>
              {r.total} {r.total === 1 ? 'thing' : 'things'} done
            </h3>
            {r.minutes > 0 && <p className="small muted" style={{ margin: 0 }}>{formatMinutes(r.minutes)} of getting stuff done</p>}
          </div>
        </div>

        {r.fun.length > 0 && (
          <div className="card">
            <h3>Fun things from this stretch</h3>
            <div className="chips" style={{ marginTop: 10 }}>
              {r.fun.map((t) => (
                <span key={t} className="chip want on">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {r.topCategories.length > 0 && (
          <div className="card">
            <h3>What filled the days</h3>
            <div className="stack" style={{ gap: 6, marginTop: 8 }}>
              {r.topCategories.map((c) => (
                <div key={c.id} className="row spread">
                  <span>
                    {c.icon} {c.label}
                  </span>
                  <span className="muted">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {r.total === 0 && <p className="muted">A quiet stretch. This plant waited patiently.</p>}
      </div>
    </Sheet>
  )
}
