import { useState } from 'react'
import { DURATIONS, durationLabel, uid } from '../lib/model.js'
import { useStore } from '../store.jsx'
import { Sheet } from './ui.jsx'

/** Custom event prep templates, e.g. "Volleyball tournament". */
export default function PrepTemplateEditor({ template, onClose }) {
  const { actions } = useStore()
  const [draft, setDraft] = useState(
    () =>
      template || {
        id: uid(),
        name: '',
        items: [{ id: uid(), title: '', daysBefore: 1, minutes: 15 }],
        packing: [],
      },
  )
  const [packingText, setPackingText] = useState((draft.packing || []).join('\n'))
  const setItem = (id, fields) => setDraft((d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...fields } : i)) }))
  const readOnly = !!template?.builtIn

  const save = () => {
    actions.savePrepTemplate({
      ...draft,
      builtIn: false,
      name: draft.name.trim() || 'My event',
      items: draft.items.filter((i) => i.title.trim()).map((i) => ({ ...i, title: i.title.trim() })),
      packing: packingText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    })
    onClose()
  }

  return (
    <Sheet title={readOnly ? draft.name : template ? 'Edit prep template' : 'New prep template'} onClose={onClose}>
      <div className="stack">
        {readOnly && <p className="small muted" style={{ margin: 0 }}>Built-in template. Make a copy to change it.</p>}
        <input className="input" placeholder="e.g. Volleyball tournament" value={draft.name} disabled={readOnly} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="Template name" />
        <p className="label" style={{ margin: 0 }}>
          Prep tasks
        </p>
        {draft.items.map((item) => (
          <div key={item.id} className="block-row">
            <div className="row">
              <input className="input" placeholder="e.g. Wash jerseys" value={item.title} disabled={readOnly} onChange={(e) => setItem(item.id, { title: e.target.value })} aria-label="Prep task" />
              {!readOnly && (
                <button className="icon-btn" aria-label="Remove prep task" onClick={() => setDraft((d) => ({ ...d, items: d.items.filter((i) => i.id !== item.id) }))}>
                  ×
                </button>
              )}
            </div>
            <div className="row wrap small">
              <input
                className="input"
                type="number"
                min="0"
                style={{ width: 76 }}
                value={item.daysBefore}
                disabled={readOnly}
                onChange={(e) => setItem(item.id, { daysBefore: Math.max(0, Number(e.target.value) || 0) })}
                aria-label="Days before"
              />
              <span className="muted">days before ·</span>
              <select className="input" style={{ width: 'auto' }} value={item.minutes} disabled={readOnly} onChange={(e) => setItem(item.id, { minutes: Number(e.target.value) })} aria-label="Duration">
                {DURATIONS.map((m) => (
                  <option key={m} value={m}>
                    {durationLabel(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {!readOnly && (
          <button className="btn" onClick={() => setDraft((d) => ({ ...d, items: [...d.items, { id: uid(), title: '', daysBefore: 1, minutes: 15 }] }))}>
            + Add prep task
          </button>
        )}
        <div className="field">
          <label htmlFor="packing">Packing list (one per line, optional)</label>
          <textarea id="packing" className="input" rows={4} value={packingText} disabled={readOnly} onChange={(e) => setPackingText(e.target.value)} />
        </div>
        {readOnly ? (
          <button
            className="btn primary big"
            onClick={() => {
              actions.savePrepTemplate({
                ...structuredClone(draft),
                id: uid(),
                builtIn: false,
                name: `${draft.name} (my version)`,
              })
              onClose()
            }}
          >
            Make my own copy
          </button>
        ) : (
          <>
            <button className="btn primary big" onClick={save}>
              Save
            </button>
            {template && (
              <button
                className="btn ghost danger"
                onClick={() => {
                  actions.deletePrepTemplate(template.id)
                  onClose()
                }}
              >
                Delete template
              </button>
            )}
          </>
        )}
      </div>
    </Sheet>
  )
}
