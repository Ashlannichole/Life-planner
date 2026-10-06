import { useEffect, useState } from 'react'
import { useStore } from '../store.jsx'
import { Sheet, useToast } from './ui.jsx'

/** Settings' sign-in sheet: the account form in a bottom sheet. */
export default function AccountSheet({ onClose }) {
  const [waiting, setWaiting] = useState(false)
  return (
    <Sheet title={waiting ? 'Check your email' : 'Use on all your devices'} onClose={onClose}>
      <AccountForm onDone={onClose} onWaiting={setWaiting} />
    </Sheet>
  )
}

const DEFAULT_INTRO = (
  <p className="muted" style={{ margin: 0 }}>
    Sign in with your email and your plan follows you to your phone and iPad. New here? The same step creates your
    account. No password needed.
  </p>
)

/**
 * Sign in or sign up from an email: tap its link, or type its 6-digit code. No password to remember.
 * Used in the Settings sheet and on the welcome screen.
 */
export function AccountForm({ onDone, onWaiting, intro = DEFAULT_INTRO, submitLabel = 'Email me a sign-in link', autoFocus = true, showCarryOver = true }) {
  const { cloud } = useStore()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email')
  const [showCode, setShowCode] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => onWaiting?.(step === 'code'), [step, onWaiting])

  // Tapping the link in the email signs in (possibly in another tab); finish once that happens.
  useEffect(() => {
    if (step === 'code' && cloud.user) {
      toast('Signed in. Your plan will sync across devices.')
      onDone?.()
    }
  }, [step, cloud.user, toast, onDone])

  const run = async (fn) => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (err) {
      setError(err?.message || 'Something went wrong. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {step === 'email' ? (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            run(async () => {
              await cloud.sendCode(email.trim())
              setStep('code')
            })
          }}
        >
          {intro}
          <input
            className="input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
            autoFocus={autoFocus}
          />
          {error && <p className="small" style={{ color: '#c0605a', margin: 0 }}>{error}</p>}
          <button className="btn primary big" type="submit" disabled={busy || !/.+@.+\..+/.test(email)}>
            {busy ? 'Sending…' : submitLabel}
          </button>
          {showCarryOver && (
            <p className="small muted" style={{ margin: 0 }}>
              Anything already on this device comes along to your account.
            </p>
          )}
        </form>
      ) : (
        <div className="stack">
          <p style={{ margin: 0 }}>
            Open the email we sent to <b>{email}</b> on this device and tap the button in it.
          </p>
          <p className="small muted" style={{ margin: 0 }}>
            The first time it says <b>“Confirm your email”</b>; after that it says <b>“Log in”</b>. Either one signs you in, and
            this screen updates by itself.
          </p>
          {showCode ? (
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault()
                run(async () => {
                  await cloud.verifyCode(email.trim(), code.trim())
                  toast('Signed in. Your plan will sync across devices.')
                  onDone?.()
                })
              }}
            >
              <input
                className="input code-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                aria-label="Code"
                autoFocus
              />
              {error && <p className="small" style={{ color: '#c0605a', margin: 0 }}>{error}</p>}
              <button className="btn primary big" type="submit" disabled={busy || code.length < 6}>
                {busy ? 'Checking…' : 'Sign in'}
              </button>
            </form>
          ) : (
            <button type="button" className="btn ghost small" onClick={() => setShowCode(true)}>
              My email has a 6-digit code instead
            </button>
          )}
          <button type="button" className="btn ghost" onClick={() => setStep('email')}>
            Use a different email
          </button>
        </div>
      )}
    </>
  )
}
