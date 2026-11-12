// "Plus": the paid tier, bought in the iPhone app through Apple in-app purchase
// (RevenueCat; see mobile/purchases.js). The App Store's answer is saved on the account
// (`state.plus`), so Plus also works on the website and other devices once bought.
//
// While PLUS_FREE_DURING_BETA is true everyone gets Plus and buying is only for testing the
// purchase flow (TestFlight purchases are free). Set it to false for the App Store launch.

export const PLUS_FREE_DURING_BETA = true

/** Bought and not expired. */
export function plusActive(state, now = Date.now()) {
  const p = state?.plus
  if (!p?.active) return false
  return !p.expires || new Date(p.expires).getTime() > now
}

export function hasPlus(state) {
  return PLUS_FREE_DURING_BETA || plusActive(state)
}

export const PLUS_LABEL = PLUS_FREE_DURING_BETA ? 'Plus · free in beta' : 'Plus'

// What each tier gets, for the "What's in Plus" page. Free stays genuinely useful on its
// own; Plus is the extra-cozy, does-even-more-for-you version.
export const FREE_FEATURES = [
  ['🗓️', 'Your plan, made for you', 'Tasks, chores and routines placed on the right days automatically'],
  ['🌱', 'A plant that grows', 'Every finished task waters it. It never wilts.'],
  ['🫙', 'Wins jar', 'Everything you finish goes in. Shake it on a hard day.'],
  ['📱', 'Home-screen widget', 'Your next tiny thing and your plant, without opening the app (iPhone app)'],
  ['🎯', 'Focus mode', 'One thing at a time, with a timer'],
  ['🧳', 'Events & trips', 'Prep and packing planned backward from the day'],
  ['📅', 'Month calendar', 'Events, holidays, birthdays and anniversaries'],
  ['🔄', 'Calendar sync', 'Your iPhone calendar in your plan, and Sprout’s events in your calendar (iPhone app)'],
  ['🌙', 'Low-energy days', 'One tap for a lighter day'],
  ['👋', 'Welcome back', 'Away a while? A fresh start, never a pile'],
  ['☁️', 'Sync', 'Phone, iPad and computer'],
  ['🔔', 'Gentle reminders', 'A morning check-in, an afternoon nudge if nothing’s done yet, a heads-up before events (iPhone app)'],
]

export const PLUS_FEATURES = [
  ['🛏️', 'Bed days', 'Only things you can do lying down. Rest is on the plan.'],
  ['✂️', 'Make it smaller', 'Scary tasks become tiny steps you can tick off'],
  ['🌿', 'Do it with me', 'Your plant keeps you company in focus mode, with rain or brown noise'],
  ['🧠', 'Dump it all at once', 'Type everything on your mind; days and times are picked out for you'],
  ['❤️', 'Apple Health', 'Oura or Apple Watch sleep suggests lighter days; calories in Meals'],
  ['🦃', 'Holiday prep', 'Answer one question; the prep gets planned'],
  ['🕸️', 'Seasonal plants', 'Rare plants that only turn up in their month: poisonous ones in October, holly in December'],
  ['🎃', 'Holiday themes', 'Twinkly lights, cute critters and a party on your birthday'],
]
