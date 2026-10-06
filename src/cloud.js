import { useCallback, useEffect, useRef, useState } from 'react'
import { mergeState, syncable } from './lib/merge.js'
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
  const [status, setStatus] = useState(syncAvailable ? 'signed-out' : 'unavailable')
  const [lastSynced, setLastSynced] = useState(null)
  const metaRef = useRef(loadSyncMeta())
  const running = useRef(false)
  const again = useRef(false)
  const remote = useRef(supabase ? supabaseRemote(supabase) : null)

  // Track the signed-in account.
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
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

  const sendCode = useCallback(async (email) => {
    // The email has a sign-in link, plus a 6-digit code when the project's template includes {{ .Token }}.
    // The link comes back to this same site, which signs in on arrival.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + window.location.pathname },
    })
    if (error) throw error
  }, [])

  const verifyCode = useCallback(async (email, token) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (error) throw error
  }, [])

  /** Sign out of this device. The planner stays here; it just stops syncing. */
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    metaRef.current = null
    saveSyncMeta(null)
    setLastSynced(null)
  }, [])

  /**
   * Permanently delete the account and everything synced with it, in the
   * planner and the Rung app (App Store requirement). This device keeps its copy.
   */
  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.rpc('delete_my_account')
    if (error) throw error
    await supabase.auth.signOut()
    metaRef.current = null
    saveSyncMeta(null)
    setLastSynced(null)
  }, [])

  return { available: syncAvailable, user, status, lastSynced, sendCode, verifyCode, signOut, deleteAccount, syncNow }
}
