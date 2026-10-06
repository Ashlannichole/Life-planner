import { useRef, useState } from 'react'
import AccountSheet, { NewPasswordSheet } from '../components/AccountSheet.jsx'
import PrepTemplateEditor from '../components/PrepTemplateEditor.jsx'
import SpecialDaysSheet from '../components/SpecialDaysSheet.jsx'
import TemplateEditor, { weeklyFreeMinutes } from '../components/TemplateEditor.jsx'
import { Icon, Toggle, useToast } from '../components/ui.jsx'
import { formatMinutes } from '../lib/dates.js'
import { APP_NAME, DEFAULT_TEMPLATE_BLOCKS, uid } from '../lib/model.js'
import { MILESTONES, THEMES } from '../lib/milestones.js'
import { hasPlus, PLUS_LABEL } from '../lib/plus.js'
import { seasonFor } from '../lib/seasons.js'
import { allPrepTemplates } from '../lib/prep.js'
import { useStore } from '../store.jsx'

const SYNC_LABELS = {
  syncing: 'Syncing…',
  synced: 'All synced',
  offline: 'Offline. Changes are saved here and will sync when you’re back online.',
  error: 'Couldn’t sync just now. Your changes are safe here; it will try again.',
}

export default function Settings({ onBack }) {
  const { state, actions, cloud, today } = useStore()
  const [specialOpen, setSpecialOpen] = useState(false)
  const plus = hasPlus(state)
  const season = seasonFor(today)
  const toast = useToast()
  const [signingIn, setSigningIn] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
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
        <p className="section-title">Account & devices</p>
        <div className="card stack">
          {!cloud.available ? (
            <p className="small muted" style={{ margin: 0 }}>
              Accounts aren’t switched on for this copy of the app yet, so everything stays on this device.
            </p>
          ) : cloud.user ? (
            <>
              <div className="row spread">
                <span>
                  Signed in as <b>{cloud.user.email}</b>
                </span>
              </div>
              <p className="small muted" style={{ margin: 0 }}>
                {SYNC_LABELS[cloud.status] || ''}
                {cloud.status === 'synced' && cloud.lastSynced ? ` · ${new Date(cloud.lastSynced).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
              </p>
              <div className="row">
                <button className="btn" onClick={cloud.syncNow}>
                  Sync now
                </button>
                <button className="btn ghost" onClick={() => setChangingPassword(true)}>
                  Change password
                </button>
                <button
                  className="btn ghost"
                  onClick={async () => {
                    // Signing out clears this device; changes that haven't reached the account would be lost.
                    const unsaved = cloud.status === 'offline' || cloud.status === 'error'
                    if (unsaved && !window.confirm('Your latest changes haven’t reached your account yet, and signing out clears them from this device. Sign out anyway?')) return
                    await cloud.signOut()
                  }}
                >
                  Sign out
                </button>
              </div>
              {confirmDelete ? (
                <div className="stack" style={{ gap: 8 }}>
                  <p className="small muted" style={{ margin: 0 }}>
                    This permanently deletes your account and everything synced with it, in the planner and the Rung workout
                    app, and clears it from this device.
                  </p>
                  <button
                    className="btn danger"
                    onClick={async () => {
                      try {
                        await cloud.deleteAccount()
                      } catch (err) {
                        toast(err?.message || 'Couldn’t delete the account just now')
                        setConfirmDelete(false)
                      }
                    }}
                  >
                    Yes, delete my account
                  </button>
                  <button className="btn ghost" onClick={() => setConfirmDelete(false)}>
                    Keep my account
                  </button>
                </div>
              ) : (
                <button className="btn ghost danger small" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirmDelete(true)}>
                  Delete account
                </button>
              )}
            </>
          ) : (
            <>
              <p className="small muted" style={{ margin: 0 }}>
                Sign in to use your planner on your phone and iPad. Everything on this device comes along.
              </p>
              <button className="btn primary" onClick={() => setSigningIn(true)}>
                Sign in or create an account
              </button>
            </>
          )}
        </div>
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
        <p className="section-title">
          Plus <span className="plus-badge">{PLUS_LABEL}</span>
        </p>
        <div className="card stack">
          <div className="row spread">
            <span>
              <b>Holiday prep</b>
              <br />
              <span className="small muted">
                A few weeks before Thanksgiving, Christmas, birthdays and more, answer one question and the prep gets planned.
              </span>
            </span>
            <Toggle on={!!state.settings.holidayPrep && plus} onChange={(holidayPrep) => actions.updateSettings({ holidayPrep })} label="Holiday prep" />
          </div>
          <div className="row spread">
            <span>
              <b>Seasonal themes</b>
              <br />
              <span className="small muted">
                Colors that change with the month. This month: {season.emoji} {season.name}.
              </span>
            </span>
            <Toggle on={!!state.settings.seasonalTheme && plus} onChange={(seasonalTheme) => actions.updateSettings({ seasonalTheme })} label="Seasonal themes" />
          </div>
        </div>
      </div>

      <div className="section">
        <p className="section-title">Holidays & special days</p>
        <div className="card stack">
          <div className="row spread">
            <span>Show holidays on the calendar</span>
            <Toggle on={state.settings.showHolidays !== false} onChange={(showHolidays) => actions.updateSettings({ showHolidays })} label="Show holidays" />
          </div>
          <button className="btn" onClick={() => setSpecialOpen(true)}>
            🎂 Birthdays & anniversaries{state.specialDays?.length ? ` · ${state.specialDays.length}` : ''}
          </button>
        </div>
      </div>

      <div className="section">
        <p className="section-title">Color theme{state.settings.seasonalTheme && plus ? ' (seasonal theme is on)' : ''}</p>
        <div className="chips">
          {THEMES.map((t) => {
            const unlocked = (state.unlockedThemes || ['sage']).includes(t.id)
            const hint = MILESTONES.find((m) => m.reward.kind === 'theme' && m.reward.id === t.id)
            return (
              <button
                key={t.id}
                className={`chip ${state.settings.theme === t.id ? 'on' : ''}`}
                disabled={!unlocked}
                style={{ opacity: unlocked ? 1 : 0.5 }}
                title={unlocked ? t.name : `Unlocks at: ${hint?.title}`}
                onClick={() => actions.updateSettings({ theme: t.id })}
              >
                <span className="theme-swatch" style={{ background: t.light }} aria-hidden="true" /> {unlocked ? t.name : `🔒 ${hint?.title}`}
              </button>
            )
          })}
        </div>
      </div>

      <div className="section">
        <p className="section-title">Nutrition (optional)</p>
        <div className="card stack">
          <div className="row spread">
            <span>Show calories on recipes and meals</span>
            <Toggle on={!!state.settings.nutrition} onChange={(nutrition) => actions.updateSettings({ nutrition })} label="Nutrition" />
          </div>
          {state.settings.nutrition && (
            <>
              <div className="field">
                <label htmlFor="target">Daily calorie target (optional)</label>
                <input
                  id="target"
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="Leave empty for none"
                  value={state.settings.calorieTarget ?? ''}
                  onChange={(e) => actions.updateSettings({ calorieTarget: e.target.value ? Math.max(0, Number(e.target.value)) : null })}
                />
              </div>
              <p className="small muted" style={{ margin: 0 }}>
                With a target, “Suggest meals” picks recipes that fit it for you. Totals are just information; nothing is ever marked
                over or under. Syncing from Apple Health (Oura ring, VeSync scale) will come with the iPhone app.
              </p>
            </>
          )}
        </div>
      </div>

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

      {specialOpen && <SpecialDaysSheet onClose={() => setSpecialOpen(false)} />}
      {signingIn && <AccountSheet onClose={() => setSigningIn(false)} />}
      {changingPassword && <NewPasswordSheet title="Change password" onClose={() => setChangingPassword(false)} />}
      {editingTemplate && <TemplateEditor template={editingTemplate} onClose={() => setEditingTemplate(null)} />}
      {editingPrep && <PrepTemplateEditor template={editingPrep.new ? null : editingPrep} onClose={() => setEditingPrep(null)} />}
    </div>
  )
}
