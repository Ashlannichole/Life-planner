import { useEffect } from 'react'
import { formatMinutes, formatShortDate } from '../lib/dates.js'
import { plantType } from '../lib/plant.js'
import { weeklyRecap } from '../lib/recap.js'
import { useStore } from '../store.jsx'
import Plant from './Plant.jsx'
import { Sheet } from './ui.jsx'

export default function Recap({ onClose }) {
  const { state, today, actions } = useStore()
  const r = weeklyRecap(state, today)
  const plant = state.plant.current

  useEffect(() => {
    actions.updateSettings({ recapSeen: today })
  }, [actions, today])

  return (
    <Sheet title="Your week in bloom" onClose={onClose}>
      <div className="stack">
        <p className="muted" style={{ margin: 0 }}>
          {formatShortDate(r.start)} – {formatShortDate(r.end)}
        </p>

        {r.total === 0 ? (
          <div className="empty card">
            <span className="big-emoji">☁️</span>
            <b>A quiet week.</b>
            <p className="small">Rest counts too. Your plant waited patiently and will be right here when you’re ready.</p>
          </div>
        ) : (
          <>
            <div className="stat-grid">
              <div className="stat">
                <b>{r.total}</b>
                <span className="small muted">things done</span>
              </div>
              <div className="stat want">
                <b>{r.funCount}</b>
                <span className="small muted">fun things</span>
              </div>
              <div className="stat">
                <b>{formatMinutes(r.minutes)}</b>
                <span className="small muted">of getting stuff done</span>
              </div>
              <div className="stat">
                <b>{r.activeDays}</b>
                <span className="small muted">{r.activeDays === 1 ? 'day' : 'days'} you showed up</span>
              </div>
            </div>

            {r.fun.length > 0 && (
              <div className="card">
                <h3>You made time for</h3>
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
                <h3>Where your energy went</h3>
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
          </>
        )}

        <div className="card row">
          <Plant typeId={plant.typeId} potId={plant.potId} water={plant.water} size={64} />
          <div>
            <h3>Garden</h3>
            <p className="small muted" style={{ margin: 0 }}>
              {r.bloomed.length > 0
                ? `${r.bloomed.map((p) => plantType(p.typeId).name).join(', ')} bloomed this week!`
                : `${state.plant.garden.length} ${state.plant.garden.length === 1 ? 'plant' : 'plants'} in your garden so far.`}
              {r.unlocks.length > 0 && ` New this week: ${r.unlocks.map((u) => u.name).join(', ')}.`}
            </p>
          </div>
        </div>

        <button className="btn primary big" onClick={onClose}>
          On to next week
        </button>
      </div>
    </Sheet>
  )
}
