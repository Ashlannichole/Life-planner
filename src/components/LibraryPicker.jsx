import { durationLabel } from '../lib/model.js'
import { libraryGroups } from '../lib/library.js'

const FREQ = { daily: 'daily', weekly: 'weekly', biweekly: 'every 2 wks', monthly: 'monthly', seasonal: 'seasonal' }

/**
 * Tap-to-pick list of common chores, grouped by category. `selected` is a Set
 * of library indexes; entries in `added` (by title) are already on the list.
 */
export default function LibraryPicker({ selected, onChange, isAdded = () => false }) {
  const toggle = (index) => {
    const next = new Set(selected)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    onChange(next)
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      {libraryGroups().map((group) => {
        const open = group.entries.filter((e) => !isAdded(e.title))
        const allOn = open.length > 0 && open.every((e) => selected.has(e.index))
        return (
          <div key={group.id} className="stack" style={{ gap: 8 }}>
            <div className="row spread">
              <p className="section-title" style={{ margin: 0 }}>
                {group.icon} {group.label}
              </p>
              {open.length > 1 && (
                <button
                  type="button"
                  className="btn ghost small"
                  style={{ minHeight: 30, padding: '2px 8px' }}
                  onClick={() => {
                    const next = new Set(selected)
                    for (const e of open) allOn ? next.delete(e.index) : next.add(e.index)
                    onChange(next)
                  }}
                >
                  {allOn ? 'Clear' : 'Pick all'}
                </button>
              )}
            </div>
            <div className="chips">
              {group.entries.map((e) => {
                const added = isAdded(e.title)
                const on = added || selected.has(e.index)
                return (
                  <button
                    key={e.index}
                    type="button"
                    className={`chip lib-chip ${on ? 'on' : ''}`}
                    disabled={added}
                    aria-pressed={on}
                    onClick={() => toggle(e.index)}
                  >
                    {on ? '✓ ' : '+ '}
                    {e.title}
                    <span className="lib-meta">
                      {FREQ[e.frequency] || e.frequency} · {durationLabel(e.estimatedMinutes)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
