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

## How it's built

- **React + Vite**, plain JavaScript, no router (tabs are in-app state), `@dnd-kit` for drag and drop.
- **Local storage only** (`src/lib/storage.js`). Settings → "Download a backup" exports everything as JSON.
- **Mobile-first**, with safe-area insets, a home-screen manifest and dark mode. Ready for Capacitor later.

| Where | What |
| --- | --- |
| `src/lib/scheduler.js` | The rule-based scheduler (pure functions, fully tested) |
| `src/lib/model.js` | Data shapes, defaults, categories, built-in trip template, app name |
| `src/lib/plant.js` | Growth stages, garden, surprise rewards |
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

## Not in v1

Everything in the v2 section of the spec (accounts, sync, friends, shared garden, body doubling,
challenges, notifications, calendar import). The app name and final art direction are still open.
