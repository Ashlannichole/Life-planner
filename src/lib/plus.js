// "Plus": the paid tier. There's no payment yet (in the iPhone app it has to go through
// Apple's in-app purchase), so Plus features are free during the beta. When payments
// arrive, only `hasPlus` changes; every Plus feature already asks it.

export const PLUS_FREE_DURING_BETA = true

export function hasPlus(state) {
  return PLUS_FREE_DURING_BETA || !!state?.plus?.active
}

export const PLUS_LABEL = PLUS_FREE_DURING_BETA ? 'Plus · free in beta' : 'Plus'

// What each tier gets, for the "What's in Plus" page. Free stays genuinely useful on its
// own; Plus is the extra-cozy, does-even-more-for-you version.
export const FREE_FEATURES = [
  ['🗓️', 'Your plan, made for you', 'Tasks, chores and routines placed on the right days automatically'],
  ['🌱', 'A plant that grows', 'Every finished task waters it. It never wilts.'],
  ['🎯', 'Focus mode', 'One thing at a time, with a timer'],
  ['🧳', 'Events & trips', 'Prep and packing planned backward from the day'],
  ['📅', 'Month calendar', 'Events, holidays, birthdays and anniversaries'],
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
  ['🎃', 'Holiday themes', 'Twinkly lights, cute critters and a party on your birthday'],
]
