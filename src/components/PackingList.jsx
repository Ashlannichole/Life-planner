import { useState } from 'react'
import { uid } from '../lib/model.js'
import { useStore } from '../store.jsx'
import { useToast } from './ui.jsx'

/** A checkable packing list attached to an event, saveable for reuse. */
export default function PackingList({ event }) {
  const { state, actions } = useStore()
  const toast = useToast()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(event.title)
  const items = event.packing || []
  const setItems = (packing) => actions.updateEvent(event.id, { packing })

  const add = (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    setItems([...items, { id: uid(), text: t, packed: false }])
    setText('')
  }

  const packed = items.filter((i) => i.packed).length

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row spread">
        <p className="section-title" style={{ margin: 0 }}>
          Packing list {items.length > 0 && `· ${packed}/${items.length}`}
        </p>
      </div>
      {items.length > 0 && (
        <div className="menu">
          {items.map((item) => (
            <div key={item.id} className="row" style={{ borderBottom: '1px solid var(--line)', paddingRight: 8 }}>
              <button
                style={{ flex: 1, border: 0, textDecoration: item.packed ? 'line-through' : 'none', color: item.packed ? 'var(--muted)' : undefined }}
                onClick={() => setItems(items.map((i) => (i.id === item.id ? { ...i, packed: !i.packed } : i)))}
              >
                <span style={{ width: 22 }}>{item.packed ? '☑' : '☐'}</span>
                {item.text}
              </button>
              <button className="icon-btn" style={{ padding: 0, border: 0 }} aria-label={`Remove ${item.text}`} onClick={() => setItems(items.filter((i) => i.id !== item.id))}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <form className="quick-add" onSubmit={add}>
        <input placeholder="Add an item" value={text} onChange={(e) => setText(e.target.value)} aria-label="Packing item" />
        <button className="btn" type="submit" disabled={!text.trim()}>
          Add
        </button>
      </form>
      {state.packingLists.length > 0 && (
        <div className="chips">
          {state.packingLists.map((list) => (
            <button
              key={list.id}
              className="chip"
              onClick={() => {
                const existing = new Set(items.map((i) => i.text.toLowerCase()))
                const extra = list.items.filter((t) => !existing.has(t.toLowerCase()))
                setItems([...items, ...extra.map((t) => ({ id: uid(), text: t, packed: false }))])
                toast(`Added ${extra.length} from “${list.name}”`)
              }}
            >
              + {list.name}
            </button>
          ))}
        </div>
      )}
      {items.length > 0 &&
        (saving ? (
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault()
              if (!name.trim()) return
              actions.savePackingList(
                name.trim(),
                items.map((i) => i.text),
              )
              setSaving(false)
              toast('Saved for next time')
            }}
          >
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} aria-label="List name" autoFocus />
            <button className="btn primary" type="submit">
              Save
            </button>
          </form>
        ) : (
          <button className="btn ghost small" onClick={() => setSaving(true)}>
            Save this list to reuse
          </button>
        ))}
    </div>
  )
}
