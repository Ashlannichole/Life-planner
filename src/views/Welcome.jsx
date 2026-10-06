import { useState } from 'react'
import { AccountForm } from '../components/AccountSheet.jsx'
import Plant from '../components/Plant.jsx'
import { APP_NAME } from '../lib/model.js'

/**
 * First screen when accounts are switched on: sign in or create an account
 * (one step, same email form either way), or carry on without one.
 */
export default function Welcome({ onSkip }) {
  const [waiting, setWaiting] = useState(false)

  return (
    <div className="onboarding welcome">
      <div className="grow stack" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <Plant typeId="sunflower" potId="terracotta" water={10} size={waiting ? 90 : 120} />
        <h1>{waiting ? 'Check your email' : `Welcome to ${APP_NAME}`}</h1>
        {!waiting && (
          <p className="muted" style={{ maxWidth: 340, margin: 0 }}>
            Sign in to keep your plan safe and on all your devices: phone, iPad, computer.
          </p>
        )}
      </div>
      <div className="stack welcome-form">
        <AccountForm
          onWaiting={setWaiting}
          autoFocus={false}
          showCarryOver={false}
          submitLabel="Continue with email"
          intro={
            <p className="small muted" style={{ margin: 0, textAlign: 'center' }}>
              New or returning, it’s the same step. No password needed.
            </p>
          }
        />
        {!waiting && (
          <button className="btn ghost" onClick={onSkip}>
            Use without an account
          </button>
        )}
      </div>
    </div>
  )
}
