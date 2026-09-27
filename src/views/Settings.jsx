import { useRef, useState } from 'react'
import PrepTemplateEditor from '../components/PrepTemplateEditor.jsx'
import TemplateEditor, { weeklyFreeMinutes } from '../components/TemplateEditor.jsx'
import { Icon, Toggle, useToast } from '../components/ui.jsx'
import { formatMinutes } from '../lib/dates.js'
import { APP_NAME, DEFAULT_TEMPLATE_BLOCKS, uid } from '../lib/model.js'
import { allPrepTemplates } from '../lib/prep.js'
import { useStore } from '../store.jsx'

export default function Settings({ onBack }) {
  const { state, actions } = useStore()
  const toast = useToast()
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [editingPrep, setEditingPrep] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef(null)

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${APP_NAME.toLowerCase()}-backup.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importData = async (file) => {
    try {
      actions.importData(JSON.parse(await file.text()))
      toast('Backup restored')
    } catch {
      toast('That file couldn’t be read')
    }
  }

  return (
    <div className="stack">
      <div className="row">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <Icon name="back" />
        </button>
        <h1>Settings</h1>
      </div>

      <div className="section">
        <p className="section-title">Free-time schedules</p>
        <div className="menu">
          {state.templates.map((t) => (
            <button key={t.id} onClick={() => setEditingTemplate(t)}>
              <span style={{ width: 20 }}>{state.activeTemplateId === t.id ? '●' : '○'}</span>
              <span style={{ flex: 1 }}>{t.name}</span>
              <span className="small muted">{formatMinutes(weeklyFreeMinutes(t.blocks))}/wk</span>
            </button>
          ))}
          <button
            onClick={() =>
              setEditingTemplate({
                id: uid(),
                name: '',
                blocks: DEFAULT_TEMPLATE_BLOCKS.map((b) => ({ ...b, id: uid() })),
              })
            }
          >
            + New schedule (e.g. “Club season”)
          </button>
        </div>
        {state.templates.length > 1 && (
          <div className="chips" style={{ marginTop: 10 }}>
            {state.templates.map((t) => (
              <button key={t.id} className={`chip ${state.activeTemplateId === t.id ? 'on' : ''}`} onClick={() => actions.setActiveTemplate(t.id)}>
                Use {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <p className="section-title">Event prep templates</p>
        <div className="menu">
          {allPrepTemplates(state).map((t) => (
            <button key={t.id} onClick={() => setEditingPrep(t)}>
              <span style={{ flex: 1 }}>{t.name}</span>
              <span className="small muted">
                {t.items.length} tasks{t.builtIn ? ' · built-in' : ''}
              </span>
            </button>
          ))}
          <button onClick={() => setEditingPrep({ new: true })}>+ New prep template</button>
        </div>
      </div>

      {state.packingLists.length > 0 && (
        <div className="section">
          <p className="section-title">Saved packing lists</p>
          <div className="menu">
            {state.packingLists.map((p) => (
              <div key={p.id} className="row spread" style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)' }}>
                <span>
                  {p.name} <span className="small muted">· {p.items.length} items</span>
                </span>
                <button className="btn ghost danger small" onClick={() => actions.deletePackingList(p.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <p className="section-title">Preferences</p>
        <div className="card stack">
          <div className="row spread">
            <span>Check-off sounds</span>
            <Toggle on={state.settings.sound} onChange={(sound) => actions.updateSettings({ sound })} label="Check-off sounds" />
          </div>
          <div className="field">
            <label htmlFor="buffer">
              Breathing room: {Math.round(state.settings.buffer * 100)}% of free time left unplanned
            </label>
            <input
              id="buffer"
              type="range"
              min="0.1"
              max="0.5"
              step="0.05"
              value={state.settings.buffer}
              onChange={(e) => actions.updateSettings({ buffer: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="section">
        <p className="section-title">Your data</p>
        <p className="small muted">Everything is saved on this device only. Make a backup if you switch phones.</p>
        <div className="menu">
          <button onClick={exportData}>Download a backup</button>
          <button onClick={() => fileRef.current?.click()}>Restore from a backup…</button>
          <button onClick={actions.restartOnboarding}>Run the setup again</button>
          {confirmReset ? (
            <button className="danger" onClick={actions.resetAll}>
              Tap again to erase everything
            </button>
          ) : (
            <button className="danger" onClick={() => setConfirmReset(true)}>
              Start over
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files[0] && importData(e.target.files[0])} />
      </div>

      {editingTemplate && <TemplateEditor template={editingTemplate} onClose={() => setEditingTemplate(null)} />}
      {editingPrep && <PrepTemplateEditor template={editingPrep.new ? null : editingPrep} onClose={() => setEditingPrep(null)} />}
    </div>
  )
}
