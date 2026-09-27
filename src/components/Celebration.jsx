import { plantType, potType } from '../lib/plant.js'
import { useStore } from '../store.jsx'
import Plant from './Plant.jsx'

export default function Celebration({ onGarden }) {
  const { celebrations, actions } = useStore()
  const c = celebrations[0]
  if (!c) return null

  let art
  let title
  let body
  if (c.kind === 'bloom') {
    art = <Plant typeId={c.plant.typeId} potId={c.plant.potId} stage={5} size={120} />
    title = `Your ${plantType(c.plant.typeId).name.toLowerCase()} is in full bloom!`
    body = 'It’s moved to your garden. Time to pick a new seed.'
  } else if (c.kind === 'stage') {
    art = <Plant typeId={c.plant.current.typeId} potId={c.plant.current.potId} water={c.plant.current.water} size={110} />
    title = `${c.stage.label}!`
    body = 'Your plant grew a little. Nice work.'
  } else {
    const r = c.reward
    art =
      r.kind === 'pot' ? (
        <Plant typeId="sunflower" potId={r.id} stage={0} size={110} />
      ) : (
        <Plant typeId={r.id} potId="terracotta" stage={5} size={110} />
      )
    title = r.rare ? '✨ A rare surprise!' : 'A little surprise'
    body = `You unlocked ${r.kind === 'pot' ? `the ${potType(r.id).name.toLowerCase()} pot` : `${plantType(r.id).name} seeds`}.`
  }

  return (
    <div className="celebrate" onClick={actions.dismissCelebration}>
      <div className="card stack" style={{ alignItems: 'center' }} onClick={(e) => e.stopPropagation()} role="alertdialog" aria-label={title}>
        {art}
        <h2>{title}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {body}
        </p>
        <button
          className="btn primary block"
          onClick={() => {
            actions.dismissCelebration()
            if (c.kind === 'bloom') onGarden()
          }}
        >
          {c.kind === 'bloom' ? 'Pick a new seed' : 'Lovely'}
        </button>
      </div>
    </div>
  )
}
