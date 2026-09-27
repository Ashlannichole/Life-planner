import { useState } from 'react'
import { useStore } from '../store.jsx'
import { Sheet, useToast } from './ui.jsx'

/** Sign in or sign up with an emailed 6-digit code. No password to remember. */
export default function AccountSheet({ onClose }) {
  const { cloud } = useStore()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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
            {busy ? 'Sending…' : 'Email me a code'}
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
            We sent a 6-digit code to <b>{email}</b>. Type it here.
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
