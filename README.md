# Sprout (working title)

A calm weekly and daily planner for people who get overwhelmed by choices, especially people with ADD/ADHD.
Dump in everything you need **and** want to do; the app decides what to do and when, works around your
events, and never makes you feel bad for missing something.

## Running it

```bash
npm install
npm run dev      # local dev server
npm test         # scheduler, recurrence, prep and plant tests
npm run build    # production build in dist/
```

## Deploying to Vercel

Import this GitHub repo in Vercel. It detects Vite automatically (build: `npm run build`, output: `dist`).
Every push to the default branch then deploys, and every PR gets a preview URL. There is no backend.

## Accounts and sync (optional)

People can create an account with an email and password to use the same planner on their phone
and iPad. Setup steps are in [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md). Without the two `VITE_SUPABASE_*`
variables, the app stays local-only.

- `src/lib/merge.js`: three-way merge of the planner state (records by id, maps by key, plant watering added up).
- `src/lib/sync.js`: one `planner_state` row per account with a version number, so concurrent saves merge
  instead of overwriting.
- `src/cloud.js`: sign-in and the background sync loop.
- `src/lib/history.js`: keeps each account small. Check-offs older than 90 days fold into tiny per-day and
  per-task summaries, which the recap, milestones, plant memories and repeating tasks all read, so nothing
  visible changes. A year of heavy use adds roughly 15–20 KB.
- Syncing first asks only for the version number; the full plan is downloaded only when another device changed it.
- `src/lib/workouts.js`: workouts from the **Rung** workout app (same account, `scheduled_workouts` table) show on
  Today and in the week, their time counts against the day like cooking time, and a finished workout becomes a
  check-off that waters the plant once.
- Settings → Account & devices includes **Delete account** (App Store requirement); it removes the account's data
  in both apps and leaves this device's copy in place.

## How it's built

- **React + Vite**, plain JavaScript, no router (tabs are in-app state), `@dnd-kit` for drag and drop.
- **Local-first** (`src/lib/storage.js`): every device keeps its own copy; optional Supabase sync on top. Settings → "Download a backup" exports everything as JSON.
- **Mobile-first**, with safe-area insets, a home-screen manifest and dark mode. Ready for Capacitor later.

| Where | What |
| --- | --- |
| `src/lib/scheduler.js` | The rule-based scheduler (pure functions, fully tested) |
| `src/lib/model.js` | Data shapes, defaults, categories, built-in trip template, app name |
| `src/lib/plant.js` | Growth stages, garden, surprise rewards |
| `src/lib/meals.js` | Recipes, meal plan suggestions, grocery list (tested) |
| `src/lib/prep.js` | Event prep tasks scheduled backward from the event |
| `src/store.jsx` | App state, persistence and all user actions |
| `src/views/*` | Today, Week, Tasks (brain dump), Events, Garden, Settings, Onboarding |
| `src/components/*` | Focus mode, editors, plant art, recap, celebrations |

## How the scheduler decides

The plan is **never stored**. It's recomputed from tasks + the active free-time template + events + your
manual moves every time anything changes, for today and the next 13 days. Past days are never planned, so
anything unfinished simply flows into the next day with room: rollover with no "overdue" state at all.

1. **Free time** = the template's blocks for that weekday, minus event time. 20% is kept as breathing room
   (adjustable), and days with a lot of events are trimmed further so busy days get lighter plans.
   All-day and multi-day events block the whole day.
2. **Your moves win**: anything you dragged to a day (or pulled into today) is placed first.
3. **Deadlines** next (event prep), earliest first, on the best day before the deadline. A deadline that
   has already passed is scheduled as soon as possible instead of being dropped.
4. **Repeating tasks**, each within its own window (a weekly task can land anywhere in its 7 days). The next
   repeat is counted from when you last did it, and missed repeats never pile up.
5. **One want-to per day**: each day with room gets a fun task before chores fill it.
6. **Everything else**, alternating need-to and want-to so fun doesn't keep losing to chores.

Each day choice is scored: sooner is better, fuller days are worse, the same category already on that day
is worse (spreads chores out), and a matching preferred time is better. "Weekend" is treated as a firm preference.
Within a day, tasks are grouped morning/afternoon/evening, start with a quick warm-up task, then alternate
need-to and want-to.

## Meals and groceries

- **Recipes** are saved once and reused. Ingredients are typed one per line ("2 cups rice"), and the amount is split from the name.
- **Meal plan**: lunch and dinner for the next 7 days. "Suggest meals" fills empty slots, rotating
  least-recently-used recipes and avoiding repeats in the same week. Lunches are only suggested once you have a lunch recipe.
- **Grocery list** is built from the planned meals. Matching ingredients are merged ("onions" = "onion") and amounts with the same
  unit are added up. Mark items "Got it" or "Have it"; a check-off lasts a week, so next week's meals ask again.
- **Planner integration**: a recipe's cooking time counts against that day's free time. "Add a shopping trip"
  creates one Grocery shopping task, due before the first meal that needs something.

## Optional nutrition and energy

- **Nutrition is off by default** (Settings → Nutrition). When on, recipes get an optional calories field and
  each planned day shows its total in plain text. Nothing is ever marked over or under.
- **Daily calorie target (optional)**: "Suggest meals" picks recipes that bring each day near its share of the
  target (lunch ~35%, dinner ~40%), while still avoiding dishes eaten in the last few days.
- **Low-energy day**: one tap on Today keeps 60% of the day's usual plan. Later, a wearable's readiness score
  (e.g. Oura via Apple Health) can set this automatically.
- **Apple Health sync** (Oura ring calories burned, VeSync scale calories eaten) needs the native iPhone app
  (Capacitor) and is planned for that phase.

## Starter chore library

`src/data/seed-tasks.json` holds 49 common chores (category, need/want, frequency, minutes). They appear as tap-to-pick
chips in onboarding and under Tasks → "Browse common chores" (`src/lib/library.js`). Frequencies map to repeats
(biweekly = every 14 days, seasonal = every 90), "personal" maps to Self-care, and chores that repeat every two
weeks or less often get their first date spread over the coming weeks so they don't all land on day one.
Titles already on the list are skipped. A weekly "Grocery shopping" chore doubles as the grocery list's shopping trip.

## Trust and gentle motivation

- **Why this day**: every scheduled task carries one plain line explaining its placement ("Prep for Portland trip,
  best done by Thu", "Keeps cleaning spread out across the week", "You said not today…"). Shown when you tap a task
  and in Focus mode.
- **Compost pile** (`src/lib/compost.js`): a one-off task pushed 5 times ("not today", moved later, or left on a
  day that ended) leaves the plan and waits in Tasks → Compost pile. Pick a real day, break it into small steps,
  give it another go, or compost it (which still waters the plant).
- **Milestones** (`src/lib/milestones.js`): based on totals only (tasks, fun tasks, days you showed up, plants grown),
  so they never reset. Each unlocks a color theme, pot or milestone-only plant.
- **Plant memories**: tap any grown plant in the garden to see what life looked like while it grew.

## Not in v1

Everything else in the v2 section of the spec (friends, shared garden, body doubling,
challenges, notifications, calendar import). The app name and final art direction are still open.
