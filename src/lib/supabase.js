import { createClient } from '@supabase/supabase-js'

// Set these in Vercel (and in a local .env file) to turn on accounts and sync.
// Without them the app runs fully on this device, exactly as before.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const syncAvailable = !!supabase
