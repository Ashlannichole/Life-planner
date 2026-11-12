import { useEffect, useState } from 'react'
import { formatShortDate, todayKey } from '../lib/dates.js'
import { askNative, hasNativeFeature, nativeApp, sendNative } from '../lib/native.js'
import { PLUS_FREE_DURING_BETA, plusActive } from '../lib/plus.js'
import { useStore } from '../store.jsx'

const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
const PRIVACY_URL = '/privacy.html'

const PERIOD = { ANNUAL: 'year', SIX_MONTH: '6 months', THREE_MONTH: '3 months', TWO_MONTH: '2 months', MONTHLY: 'month', WEEKLY: 'week' }
const NAME = { ANNUAL: 'Yearly', MONTHLY: 'Monthly', LIFETIME: 'Forever', WEEKLY: 'Weekly' }
const ORDER = ['ANNUAL', 'MONTHLY', 'LIFETIME']

function trialText(trial) {
  if (!trial) return null
  const unit = { DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year' }[trial.unit] || ''
  const n = trial.count || 1
  // "1 week" reads better as "7 days" for a free trial.
  const length = unit === 'week' && n === 1 ? '7 days' : unit ? `${n} ${unit}${n === 1 ? '' : 's'}` : 'a while'
  return trial.free ? `${length} free` : `${trial.price} for the first ${length}`
}

/** Buy, restore or manage Sprout Plus (iPhone app only; App Store through RevenueCat). */
export default function PlusPurchase() {
  const { state } = useStore()
  const canBuy = hasNativeFeature('purchases')
  const [packages, setPackages] = useState(null)
  const [busy, setBusy] = useState(null)
  const [note, setNote] = useState(null)
  const owned = plusActive(state)

  useEffect(() => {
    if (!canBuy || owned) return
    askNative({ type: 'plus:offerings' }, (m) => m.type === 'plus:offerings' || (m.type === 'error' && m.about === 'plus:offerings')).then((m) =>
      setPackages(m?.packages ? [...m.packages].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type)) : []),
    )
  }, [canBuy, owned])

  const run = async (id, message) => {
    setBusy(id)
    setNote(null)
    const reply = await askNative(
      message,
      (m) => (m.type === 'plus:status' && (m.bought || m.restored)) || m.type === 'plus:cancelled' || (m.type === 'error' && m.about === message.type),
      5 * 60 * 1000,
    )
    setBusy(null)
    if (!reply || reply.type === 'plus:cancelled') return
    if (reply.type === 'error') return setNote(reply.message || 'Something went wrong. Nothing was charged.')
    if (reply.restored && !reply.status?.active) setNote('No Plus purchase found for this Apple ID.')
  }

  if (owned) {
    const p = state.plus
    return (
      <div className="card stack plus-card">
        <b>✨ You have Sprout Plus{p.sandbox ? ' (test purchase)' : ''}</b>
        <span className="small muted">
          {p.expires ? `${p.willRenew ? 'Renews' : 'Ends'} ${formatShortDate(todayKey(new Date(p.expires)))}.` : 'Yours for good.'} Thank you for helping Sprout grow 🌱
        </span>
        {nativeApp() && p.expires && (
          <button className="btn small" onClick={() => sendNative({ type: 'plus:manage' })}>
            Manage subscription
          </button>
        )}
      </div>
    )
  }

  if (!canBuy) {
    return (
      <p className="small muted" style={{ margin: 0 }}>
        {PLUS_FREE_DURING_BETA
          ? 'When Plus launches you’ll get it in the Sprout iPhone app. Bought it there? Sign in with the same account and it’s on here too.'
          : 'Plus is bought in the Sprout iPhone app. Bought it there? Sign in with the same account and it’s on here too.'}
      </p>
    )
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      {PLUS_FREE_DURING_BETA && (
        <p className="small muted" style={{ margin: 0 }}>
          No need to buy during the beta. In TestFlight these are free test purchases, so go ahead and try the checkout.
        </p>
      )}
      {packages == null && <p className="small muted">Loading plans…</p>}
      {packages?.length === 0 && <p className="small muted">Plans aren’t available right now. Try again in a little while.</p>}
      {packages?.map((pkg) => {
        const period = PERIOD[pkg.type]
        const trial = trialText(pkg.trial)
        return (
          <button key={pkg.id} className={`btn block plan-btn ${pkg.type === 'ANNUAL' ? 'primary' : ''}`} disabled={!!busy} onClick={() => run(pkg.id, { type: 'plus:buy', packageId: pkg.id })}>
            <span>
              <b>{NAME[pkg.type] || pkg.title}</b>
              {trial && <span className="plan-trial"> · {trial}</span>}
            </span>
            <span>
              {busy === pkg.id ? '…' : period ? `${pkg.price} / ${period}` : pkg.price}
              {pkg.type === 'ANNUAL' && pkg.pricePerMonth && <span className="plan-sub">{pkg.pricePerMonth} a month</span>}
            </span>
          </button>
        )
      })}
      {note && <p className="small" style={{ margin: 0 }}>{note}</p>}
      <p className="tiny muted plan-legal" style={{ margin: 0 }}>
        Payment is charged to your Apple ID. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the
        current period, and you can manage or cancel them any time in your App Store settings.{' '}
        <a href={TERMS_URL} target="_blank" rel="noreferrer">
          Terms of Use
        </a>{' '}
        ·{' '}
        <a href={PRIVACY_URL} target="_blank" rel="noreferrer">
          Privacy
        </a>
      </p>
      <button className="btn ghost small" disabled={!!busy} onClick={() => run('restore', { type: 'plus:restore' })}>
        {busy === 'restore' ? 'Checking…' : 'Restore purchases'}
      </button>
    </div>
  )
}
