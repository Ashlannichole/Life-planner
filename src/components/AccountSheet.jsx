import { useEffect, useState } from 'react'
import { useStore } from '../store.jsx'
import { Sheet, useToast } from './ui.jsx'

/** Sign in or sign up from an email: tap its link, or type its 6-digit code. No password to remember. */
export default function AccountSheet({ onClose }) {
  const { cloud } = useStore()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Tapping the link in the email signs in (possibly in another tab); close once that happens.
  useEffect(() => {
    if (step === 'code' && cloud.user) {
      toast('Signed in. Your plan will sync across devices.')
      onClose()
    }
  }, [step, cloud.user, toast, onClose])

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
    <Sheet title={step === 'email' ? 'Use on all your devices' : 'Check your email'} onClose={onClose}>
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
          <p className="muted" style={{ margin: 0 }}>
            Sign in with your email and your plan follows you to your phone and iPad. New here? The same step creates your
            account. No password needed.
          </p>
          <input
            className="input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
            autoFocus
          />
          {error && <p className="small" style={{ color: '#c0605a', margin: 0 }}>{error}</p>}
          <button className="btn primary big" type="submit" disabled={busy || !/.+@.+\..+/.test(email)}>
            {busy ? 'Sending…' : 'Email me a sign-in link'}
          </button>
          <p className="small muted" style={{ margin: 0 }}>
            Anything already on this device comes along to your account.
          </p>
        </form>
      ) : (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            run(async () => {
              await cloud.verifyCode(email.trim(), code.trim())
              toast('Signed in. Your plan will sync across devices.')
              onClose()
            })
          }}
        >
          <p className="muted" style={{ margin: 0 }}>
            We sent an email to <b>{email}</b>. Tap the <b>sign-in link</b> in it on this device. If the email shows a
            6-digit code instead, type it here.
          </p>
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
          <button type="button" className="btn ghost" onClick={() => setStep('email')}>
            Use a different email
          </button>
        </form>
      )}
    </Sheet>
  )
}
