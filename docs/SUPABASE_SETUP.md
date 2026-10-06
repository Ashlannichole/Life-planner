# Turning on accounts and sync (Supabase)

Until these steps are done, the app runs entirely on each device, exactly as before.

The planner and the **Rung** workout app share one Supabase project, so one account (same email) works in both,
and Rung's workouts show up in the planner. Do these steps once for the shared project.

## 1. Create a Supabase project

1. Go to <https://supabase.com>, sign in, and create a new project (the free plan is fine).
2. Pick a region close to you and save the database password somewhere safe (the app doesn't need it).

## 2. Create the table

1. In the project, open **SQL Editor → New query**.
2. Paste the contents of [`supabase/migrations/0001_planner_state.sql`](../supabase/migrations/0001_planner_state.sql) and click **Run**.
3. New query again: paste [`supabase/migrations/0002_workouts_and_accounts.sql`](../supabase/migrations/0002_workouts_and_accounts.sql)
   and click **Run**. (Rung's repo has the same file; running it twice is harmless.)

This creates:

- `planner_state`: one row per account for the planner.
- `workout_state`: one row per account for Rung.
- `scheduled_workouts`: Rung's upcoming workouts, which the planner reads.
- `delete_my_account()`: lets someone delete their account from inside either app (an App Store requirement);
  it removes everything above for that account.

Row-level security means each account can only ever read or change its own rows.

## 3. Accounts: email and password

People create an account with an email and a password, and sign in the same way in both apps.

1. Under **Authentication → Sign In / Providers → Email**, make sure **Email** is on. Leave **Confirm email** on:
   new accounts get a "Confirm your email" message, and tapping it finishes the account and signs them in.
2. Open **Authentication → URL Configuration**. Set **Site URL** to the planner's live address, e.g.
   `https://your-planner.vercel.app`, and under **Redirect URLs** add both apps' live addresses with `/**` on the
   end, e.g. `https://your-planner.vercel.app/**` and `https://your-rung.vercel.app/**`. Then **Save**. The
   "Confirm your email" and "Reset password" emails bring people back to these addresses.

Forgot your password? **Sign in → Forgot your password?** emails a reset link; opening it asks for a new password.
Signed-in people can also change it under **Settings → Change password**. Accounts made earlier with an email link
have no password yet: use "Forgot your password?" once to set one.

### Before inviting other people: your own email sender

Supabase's built-in sender only emails your own team, a few times an hour, which is fine for testing. Before other
people sign up, add an SMTP provider under **Authentication → Emails → SMTP settings** (Resend, Postmark, SendGrid
and similar all work; most need a domain you own). That also unlocks editing the email templates.

## 4. Connect the app

1. In Supabase, open **Project Settings → API** and copy the **Project URL** and the **anon public** key.
2. In Vercel, open the project → **Settings → Environment Variables** and add:
   - `VITE_SUPABASE_URL` = the Project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon public key
3. Redeploy (Deployments → the latest one → **Redeploy**). Variables only apply to new builds.
4. Do the same for the **Rung** project in Vercel, with the **same two values**.

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
