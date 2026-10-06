import { useEffect, useState } from 'react'
import { authMessage, MIN_PASSWORD, passwordProblem } from '../lib/authMessages.js'
import { useStore } from '../store.jsx'
import { Sheet, useToast } from './ui.jsx'

const TITLES = {
  signin: 'Sign in',
  signup: 'Create your account',
  forgot: 'Reset your password',
  'check-confirm': 'Confirm your email',
  'check-reset': 'Check your email',
}

/** Settings' sign-in sheet: the account form in a bottom sheet. */
export default function AccountSheet({ onClose, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode)
  return (
    <Sheet title={TITLES[mode]} onClose={onClose}>
      <AccountForm onDone={onClose} onModeChange={setMode} initialMode={initialMode} />
    </Sheet>
  )
}

/** A password field with a show/hide toggle. */
export function PasswordInput({ value, onChange, autoComplete, label = 'Password', placeholder }) {
  const [shown, setShown] = useState(false)
  return (
    <div className="password-field">
      <input
        className="input"
        type={shown ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      />
      <button type="button" className="password-toggle" onClick={() => setShown((s) => !s)} aria-label={shown ? 'Hide password' : 'Show password'}>
        {shown ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

/**
 * Sign in or create an account with an email and password, or reset a forgotten password.
 * Used in the Settings sheet and on the welcome screen.
 *
 * Modes: signin, signup, forgot, and two "check your email" screens (after signing up
 * when the project confirms emails, and after asking for a reset link).
 */
export function AccountForm({ onDone, onModeChange, initialMode = 'signin', autoFocus = true }) {
  const { cloud } = useStore()
  const toast = useToast()
  const [mode, setModeState] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const setMode = (next) => {
    setModeState(next)
    setError('')
    setNotice('')
    onModeChange?.(next)
  }

  // Signed in (here, or by tapping "Confirm your email" in another tab): finish.
  useEffect(() => {
    if (cloud.user && mode !== 'check-reset') {
      toast('Signed in. Your plan will sync across devices.')
      onDone?.()
    }
  }, [cloud.user, mode, toast, onDone])

  const run = async (fn) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await fn()
    } catch (err) {
      setError(authMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const emailOk = /.+@.+\..+/.test(email.trim())
  const tooShort = mode === 'signup' && password.length > 0 ? passwordProblem(password) : null

  const submit = (e) => {
    e.preventDefault()
    const addr = email.trim()
    if (mode === 'signin') run(() => cloud.signIn(addr, password))
    if (mode === 'signup') {
      run(async () => {
        const result = await cloud.signUp(addr, password)
        if (result === 'confirm-email') setMode('check-confirm')
        if (result === 'exists') {
          setMode('signin')
          setError('There’s already an account with this email. Sign in instead.')
        }
      })
    }
    if (mode === 'forgot') {
      run(async () => {
        await cloud.sendPasswordReset(addr)
        setMode('check-reset')
      })
    }
  }

  if (mode === 'check-confirm' || mode === 'check-reset') {
    return (
      <div className="stack">
        <p style={{ margin: 0 }}>
          We sent an email to <b>{email}</b>. Open it on this device and tap the button in it.
        </p>
        <p className="small muted" style={{ margin: 0 }}>
          {mode === 'check-confirm'
            ? 'It says “Confirm your email”. That finishes your account and signs you in; this screen updates by itself.'
            : 'It says “Reset password”. You’ll be signed in and asked to choose a new password.'}
        </p>
        {error && <p className="small form-error">{error}</p>}
        {notice && <p className="small muted" style={{ margin: 0 }}>{notice}</p>}
        {mode === 'check-confirm' && (
          <button
            type="button"
            className="btn ghost small"
            disabled={busy}
            onClick={() =>
              run(async () => {
                await cloud.resendConfirmation(email.trim())
                setNotice('Sent again. Check your spam folder too.')
              })
            }
          >
            Send the email again
          </button>
        )}
        <button type="button" className="btn ghost" onClick={() => setMode('signin')}>
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <form className="stack" onSubmit={submit}>
      {mode === 'forgot' ? (
        <p className="muted" style={{ margin: 0 }}>
          Enter your account’s email and we’ll send a link to choose a new password.
        </p>
      ) : (
        <div className="segmented" role="tablist" aria-label="Sign in or create an account">
          <button type="button" role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'on' : ''} onClick={() => setMode('signin')}>
            Sign in
          </button>
          <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>
            Create account
          </button>
        </div>
      )}
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
      {mode !== 'forgot' && (
        <PasswordInput
          value={password}
          onChange={setPassword}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          placeholder={mode === 'signup' ? `Password (${MIN_PASSWORD}+ characters)` : 'Password'}
        />
      )}
      {tooShort && <p className="small muted" style={{ margin: 0 }}>{tooShort}</p>}
      {error && <p className="small form-error">{error}</p>}
      <button
        className="btn primary big"
        type="submit"
        disabled={busy || !emailOk || (mode === 'signin' && !password) || (mode === 'signup' && !!passwordProblem(password))}
      >
        {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Email me a reset link'}
      </button>
      {mode === 'signin' && (
        <button type="button" className="btn ghost small" onClick={() => setMode('forgot')}>
          Forgot your password?
        </button>
      )}
      {mode === 'forgot' && (
        <button type="button" className="btn ghost" onClick={() => setMode('signin')}>
          Back to sign in
        </button>
      )}
    </form>
  )
}

/**
 * Choose a new password: after opening a "reset your password" email, or from Settings.
 */
export function NewPasswordSheet({ onClose, title = 'Choose a new password' }) {
  const { cloud } = useStore()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const problem = password ? passwordProblem(password) : null

  return (
    <Sheet title={title} onClose={onClose}>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setError('')
          try {
            await cloud.setPassword(password)
            toast('Password saved')
            onClose()
          } catch (err) {
            setError(authMessage(err))
          } finally {
            setBusy(false)
          }
        }}
      >
        {cloud.user?.email && (
          <p className="muted" style={{ margin: 0 }}>
            For <b>{cloud.user.email}</b>
          </p>
        )}
        <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" label="New password" placeholder={`New password (${MIN_PASSWORD}+ characters)`} />
        {problem && <p className="small muted" style={{ margin: 0 }}>{problem}</p>}
        {error && <p className="small form-error">{error}</p>}
        <button className="btn primary big" type="submit" disabled={busy || !!passwordProblem(password)}>
          {busy ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </Sheet>
  )
}
