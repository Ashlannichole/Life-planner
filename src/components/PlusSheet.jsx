import { FREE_FEATURES, PLUS_FEATURES, PLUS_FREE_DURING_BETA } from '../lib/plus.js'
import { Sheet } from './ui.jsx'

const Row = ([emoji, title, text]) => (
  <div key={title} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
    <span style={{ fontSize: '1.4rem', lineHeight: 1.2 }} aria-hidden="true">
      {emoji}
    </span>
    <span>
      <b>{title}</b>
      <br />
      <span className="small muted">{text}</span>
    </span>
  </div>
)

/** Free vs Plus, side by side in plain words. */
export default function PlusSheet({ onClose }) {
  return (
    <Sheet title="Sprout Plus" onClose={onClose}>
      <div className="stack">
        <p className="small muted" style={{ margin: 0 }}>
          {PLUS_FREE_DURING_BETA
            ? 'Everything in Plus is free while Sprout is in beta. When Plus launches, you’ll always get a reminder before any charge.'
            : 'Plus makes Sprout even cozier and does even more of the deciding for you.'}
        </p>
        <p className="section-title" style={{ margin: '8px 0 0' }}>
          ✨ Plus
        </p>
        <div className="card stack plus-card">{PLUS_FEATURES.map(Row)}</div>
        <p className="section-title" style={{ margin: '8px 0 0' }}>
          Always free
        </p>
        <div className="card stack">{FREE_FEATURES.map(Row)}</div>
      </div>
    </Sheet>
  )
}
