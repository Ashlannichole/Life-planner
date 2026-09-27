import Plant from '../components/Plant.jsx'
import { formatShortDate } from '../lib/dates.js'
import { BLOOM_AT, PLANT_TYPES, POTS, STAGES, plantType, stageFor, stageIndex, stageProgress } from '../lib/plant.js'
import { useStore } from '../store.jsx'

export default function Garden({ onRecap }) {
  const { state, actions } = useStore()
  const { current, garden, unlockedPlants, unlockedPots } = state.plant
  const type = plantType(current.typeId)
  const stage = stageFor(current.water)
  const next = STAGES[stageIndex(current.water) + 1]
  const canSwitchType = current.water === 0

  return (
    <div className="stack">
      <div className="row spread">
        <h1>Garden</h1>
        <button className="btn" onClick={onRecap}>
          Weekly recap
        </button>
      </div>

      <div className="card plant-hero">
        <Plant typeId={current.typeId} potId={current.potId} water={current.water} size={170} />
        <h2>{type.name}</h2>
        <p className="muted small" style={{ margin: 0 }}>
          {stage.label}
          {next ? ` · ${next.at - current.water} more ${next.at - current.water === 1 ? 'task' : 'tasks'} to ${next.label.toLowerCase()}` : ''}
        </p>
        <div className="progress" style={{ maxWidth: 220, marginTop: 6 }} aria-label={`${current.water} of ${BLOOM_AT} waterings`}>
          <span style={{ width: `${(stageIndex(current.water) + stageProgress(current.water)) * (100 / (STAGES.length - 1))}%` }} />
        </div>
        <p className="muted small" style={{ margin: '6px 0 0', textAlign: 'center' }}>
          Every finished task waters it — chores and fun things count the same. It never wilts; it just waits for you.
        </p>
      </div>

      {(canSwitchType || current.needsPick) && (
        <div className="section">
          <p className="section-title">{current.needsPick ? 'Pick your next seed' : 'Seed'}</p>
          <div className="picker">
            {PLANT_TYPES.filter((p) => unlockedPlants.includes(p.id)).map((p) => (
              <button key={p.id} className={current.typeId === p.id ? 'on' : ''} onClick={() => actions.choosePlant(p.id)}>
                <Plant typeId={p.id} potId={current.potId} stage={5} size={60} />
                <div>{p.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <p className="section-title">Pot</p>
        <div className="picker">
          {POTS.map((p) => {
            const unlocked = unlockedPots.includes(p.id)
            return (
              <button
                key={p.id}
                className={current.potId === p.id ? 'on' : ''}
                disabled={!unlocked}
                style={{ opacity: unlocked ? 1 : 0.4 }}
                onClick={() => actions.choosePot(p.id)}
                aria-label={unlocked ? p.name : 'Locked pot'}
              >
                <Plant typeId={current.typeId} potId={p.id} stage={0} size={50} />
                <div>{unlocked ? p.name : '?'}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="section">
        <p className="section-title">
          Grown plants · {garden.length}
        </p>
        {garden.length === 0 ? (
          <p className="muted small">Plants that reach full bloom are planted here to keep forever.</p>
        ) : (
          <div className="garden-grid">
            {[...garden].reverse().map((p) => (
              <div key={p.id} className="garden-cell">
                <Plant typeId={p.typeId} potId={p.potId} stage={5} size={70} />
                <div>{plantType(p.typeId).name}</div>
                <div>{formatShortDate(p.completedAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <p className="section-title">Seed collection</p>
        <div className="garden-grid">
          {PLANT_TYPES.map((p) => {
            const unlocked = unlockedPlants.includes(p.id)
            return (
              <div key={p.id} className={`garden-cell ${unlocked ? '' : 'locked'}`}>
                <Plant typeId={p.id} potId="terracotta" stage={unlocked ? 5 : 1} size={56} />
                <div>{unlocked ? p.name : p.rare ? 'Rare seed' : 'Surprise'}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
