# Turning on accounts and sync (Supabase)

Until these steps are done, the app runs entirely on each device, exactly as before.

## 1. Create a Supabase project

1. Go to <https://supabase.com>, sign in, and create a new project (the free plan is fine).
2. Pick a region close to you and save the database password somewhere safe (the app doesn't need it).

## 2. Create the table

1. In the project, open **SQL Editor → New query**.
2. Paste the contents of [`supabase/migrations/0001_planner_state.sql`](../supabase/migrations/0001_planner_state.sql) and click **Run**.

This creates one `planner_state` row per account. Row-level security means each account can only ever read or
change its own row.

## 3. Send a 6-digit code instead of a link

Sign-in uses a code (links don't open inside a home-screen app on iPhone/iPad).

1. Open **Authentication → Emails → Templates → Magic Link**. Emailed codes use this template too.
2. Replace the body with something like:

   ```html
   <h2>Your sign-in code</h2>
   <p>Enter this code in the app: <strong>{{ .Token }}</strong></p>
   ```

3. Under **Authentication → Sign In / Providers → Email**, make sure Email is enabled.

> Supabase's built-in email sender only allows a handful of emails per hour. That's fine for testing. Before
> inviting other people, add your own SMTP provider under **Authentication → Emails → SMTP settings** (Resend,
> Postmark, SendGrid and similar all work).

## 4. Connect the app

1. In Supabase, open **Project Settings → API** and copy the **Project URL** and the **anon public** key.
2. In Vercel, open the project → **Settings → Environment Variables** and add:
   - `VITE_SUPABASE_URL` = the Project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon public key
3. Redeploy (Deployments → the latest one → **Redeploy**). Variables only apply to new builds.

The anon key is designed to be public; the row-level security from step 2 is what keeps data private.

For local development, copy `.env.example` to `.env.local` and fill in the same two values.

## How sync behaves

- Every device keeps its own copy, so the app works offline. Changes sync about a second and a half after you make
  them, when the app comes back to the foreground, when the network returns, and every couple of minutes.
- Edits from different devices are merged record by record (a task, an event, a check-off…). If the same record
  was changed on two devices before they synced, the device syncing last keeps its version.
- On first sign-in, whatever is already on that device is added to the account. A device that was never set up
  simply receives the account's plan.
- Signing out keeps the plan on that device; it just stops syncing.

## How much room it takes

Each account is one small row. Check-offs older than 90 days are folded into compact daily summaries, so a
heavy user stays around 50–100 KB even after years. Syncing checks a version number first and only downloads the
whole plan when another device changed it, which keeps data transfer low. On the free plan that's room for
thousands of accounts; move to Pro before real users rely on it, since free projects pause after a week idle.
