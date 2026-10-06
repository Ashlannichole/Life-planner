import { useState } from 'react'
import { AccountForm } from '../components/AccountSheet.jsx'
import Plant from '../components/Plant.jsx'
import { APP_NAME } from '../lib/model.js'

/**
 * The only screen anyone sees until they sign in or create an account (email and password).
 */
export default function Welcome() {
  const [mode, setMode] = useState('signup')
  const checking = mode.startsWith('check')

  return (
    <div className="onboarding welcome">
      <div className="grow stack" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <Plant typeId="sunflower" potId="terracotta" water={10} size={checking ? 90 : 110} />
        <h1>{checking ? 'Check your email' : `Welcome to ${APP_NAME}`}</h1>
        {!checking && (
          <p className="muted" style={{ maxWidth: 340, margin: 0 }}>
            Your account keeps your plan safe and on all your devices: phone, iPad, computer.
          </p>
        )}
      </div>
      <div className="stack welcome-form">
        <AccountForm initialMode="signup" onModeChange={setMode} autoFocus={false} showCarryOver={false} />
      </div>
    </div>
  )
}
