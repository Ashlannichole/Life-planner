import { useCallback, useEffect, useRef, useState } from 'react'
import { mergeState, syncable } from './lib/merge.js'
import { initialState } from './lib/model.js'
import { housekeep, migrate } from './lib/storage.js'
import { supabase, syncAvailable } from './lib/supabase.js'
import { loadSyncMeta, saveSyncMeta, supabaseRemote, syncOnce } from './lib/sync.js'
import { applyWorkouts, fetchWorkouts, workoutWindow } from './lib/workouts.js'

const PUSH_DELAY = 1500
const POLL_EVERY = 2 * 60 * 1000

/**
 * Accounts and background sync. The planner keeps working from local storage;
 * when someone is signed in, changes are pushed shortly after they happen and
 * pulled whenever the app comes back to the foreground.
 */
export function useCloudSync({ state, stateRef, commit, today, celebrate }) {
  const [user, setUser] = useState(null)
  // False until we know whether someone is signed in, so the login screen doesn't flash up.
  const [checked, setChecked] = useState(!supabase)
  const [status, setStatus] = useState(syncAvailable ? 'signed-out' : 'unavailable')
  const [lastSynced, setLastSynced] = useState(null)
  const [recovering, setRecovering] = useState(false)
  const metaRef = useRef(loadSyncMeta())
  const running = useRef(false)
  const again = useRef(false)
  const remote = useRef(supabase ? supabaseRemote(supabase) : null)

  // Track the signed-in account.
  useEffect(() => {
    if (!supabase) return
    supabase.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user ?? null))
      .finally(() => setChecked(true))
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      // Arrived from a "reset your password" email: ask for the new password.
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const syncNow = useCallback(async () => {
    if (!user || !remote.current) return
    if (running.current) {
      again.current = true
      return
    }
    running.current = true
    setStatus('syncing')
    try {
      const sent = stateRef.current
      const { state: incoming, meta } = await syncOnce(remote.current, user.id, sent, metaRef.current)
      metaRef.current = meta
      saveSyncMeta(meta)
      if (incoming) {
        // Keep anything edited on this device while the sync was in flight.
        const current = stateRef.current
        const next = current === sent ? incoming : mergeState(syncable(sent), syncable(current), incoming)
        commit(housekeep(migrate({ ...next, planSnapshot: current.planSnapshot, workouts: current.workouts }), today))
      }

      // Workouts from the Rung app (same account): plan around them, and water the plant for finished ones.
      try {
        const rows = await fetchWorkouts(supabase, user.id, workoutWindow(today))
        const before = stateRef.current
        const { state: withWorkouts, plantEvents, reached } = applyWorkouts(before, rows, today)
        if (JSON.stringify(withWorkouts.workouts) !== JSON.stringify(before.workouts) || plantEvents.length) {
          commit(withWorkouts)
          celebrate?.(plantEvents, reached)
        }
      } catch {
        // The workouts table may not exist yet; the planner works fine without it.
      }
      setLastSynced(Date.now())
      setStatus('synced')
    } catch (err) {
      setStatus(navigator.onLine === false || /fetch|network/i.test(String(err?.message)) ? 'offline' : 'error')
    } finally {
      running.current = false
      if (again.current) {
        again.current = false
        setTimeout(syncNow, 0)
      }
    }
  }, [user, stateRef, commit, today, celebrate])

  useEffect(() => {
    if (!supabase) return
    setStatus(user ? 'syncing' : 'signed-out')
    if (user) syncNow()
  }, [user, syncNow])

  // Push local changes shortly after they happen.
  useEffect(() => {
    if (!user) return
    const id = setTimeout(syncNow, PUSH_DELAY)
    return () => clearTimeout(id)
  }, [state, user, syncNow])

  // Pull when the app comes back to the foreground, when the network returns, and every few minutes.
  useEffect(() => {
    if (!user) return
    const onVisible = () => document.visibilityState === 'visible' && syncNow()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', syncNow)
    const id = setInterval(() => document.visibilityState === 'visible' && syncNow(), POLL_EVERY)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', syncNow)
      clearInterval(id)
    }
  }, [user, syncNow])

  // Links in account emails (confirm your email, reset your password) come back to this same page.
  const here = () => window.location.origin + window.location.pathname

  /**
   * Create an account with an email and password. Returns 'signed-in' when the project
   * doesn't require email confirmation, 'confirm-email' when a confirmation email went out,
   * or 'exists' when that email already has an account.
   */
  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: here() } })
    if (error) throw error
    if (data.session) return 'signed-in'
    // Supabase answers an existing email with a user that has no identities, so it doesn't leak who's signed up.
    if (data.user && data.user.identities?.length === 0) return 'exists'
    return 'confirm-email'
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const resendConfirmation = useCallback(async (email) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: here() } })
    if (error) throw error
  }, [])

  /** Email a "reset your password" link; opening it signs in and asks for a new password. */
  const sendPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: here() })
    if (error) throw error
  }, [])

  const setPassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    setRecovering(false)
  }, [])

  /** Forget the account on this device and clear the plan, so the next person to sign in can't see it. */
  const forgetDevice = useCallback(() => {
    metaRef.current = null
    saveSyncMeta(null)
    setLastSynced(null)
    commit(initialState())
  }, [commit])

  /** Sign out of this device. The plan is saved in the account first, then cleared from here. */
  const signOut = useCallback(async () => {
    await syncNow()
    await supabase.auth.signOut()
    forgetDevice()
  }, [syncNow, forgetDevice])

  /**
   * Permanently delete the account and everything synced with it, in the
   * planner and the Rung app (App Store requirement), and clear it from this device.
   */
  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.rpc('delete_my_account')
    if (error) throw error
    await supabase.auth.signOut()
    forgetDevice()
  }, [forgetDevice])

  return {
    available: syncAvailable,
    checked,
    user,
    status,
    lastSynced,
    recovering,
    cancelRecovery: () => setRecovering(false),
    signUp,
    signIn,
    resendConfirmation,
    sendPasswordReset,
    setPassword,
    signOut,
    deleteAccount,
    syncNow,
  }
}
