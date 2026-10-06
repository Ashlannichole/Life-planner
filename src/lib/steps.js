// Plus: "Make it smaller". A scary task becomes a short checklist of tiny steps, the
// first one so small it's almost silly. Suggestions come from this library of common
// tasks; the person can edit, add or drop any step.

import { uid } from './model.js'

const LIBRARY = [
  // More specific matches first.
  [
    /fold/i,
    [
      'Dump the clean pile on the bed',
      'Pull out just the socks and match them',
      'Fold the shirts',
      'Fold everything else',
      'Put away one drawer’s worth',
    ],
  ],
  [/pay|bill/i, ['Find the bill or the login', 'Check the amount and due date', 'Pay it', 'Screenshot the confirmation']],
  [
    /laundry|wash (clothes|sheets|towels)/i,
    [
      'Grab one armful of clothes',
      'Carry it to the washer',
      'Start the wash',
      'Move it to the dryer',
      'Fold just the shirts',
      'Fold the rest while a show plays',
    ],
  ],
  [
    /dishes/i,
    [
      'Put on a song',
      'Clear everything to one side of the sink',
      'Fill the sink or start the dishwasher',
      'Wash the cups and silverware',
      'Wash the plates and pans',
      'Wipe the counter',
    ],
  ],
  [
    /clean (my |the )?(room|bedroom)|tidy (my |the )?(room|bedroom)/i,
    [
      'Set a 10-minute timer',
      'Put all trash in one bag',
      'Put all dishes by the door',
      'Put clothes in the hamper',
      'Make the bed (messy is fine)',
      'Put 10 things back where they go',
    ],
  ],
  [
    /bathroom/i,
    [
      'Spray the sink and toilet, then walk away for 5 minutes',
      'Wipe the sink and mirror',
      'Scrub the toilet',
      'Swap the towels',
      'Take out the trash',
    ],
  ],
  [/kitchen/i, ['Clear the counters into one pile', 'Load or wash the dishes', 'Wipe the counters', 'Wipe the stove top', 'Take out the trash']],
  [/vacuum/i, ['Get the vacuum out and plug it in', 'Pick up anything on the floor', 'Vacuum just one room', 'Do the rest if you’re on a roll']],
  [
    /declutter|clean out|organi[sz]e/i,
    [
      'Pick one small spot (a drawer, a shelf)',
      'Take everything out',
      'Make three piles: keep, toss, donate',
      'Put the keepers back',
      'Bag up the toss pile',
    ],
  ],
  [
    /email|inbox/i,
    ['Open your inbox', 'Delete or archive anything obviously junk', 'Star the ones that need you', 'Reply to the easiest one', 'Reply to one more'],
  ],
  [
    /tax/i,
    [
      'Make a folder (paper or computer) called Taxes',
      'Find last year’s return',
      'Gather your W-2s and 1099s',
      'Pick how you’ll file',
      'Do the first section, then stop',
    ],
  ],
  [
    /budget|finances|money/i,
    [
      'Open your bank app',
      'Write down what came in this month',
      'List your bills',
      'Pick one thing to spend less on',
      'Set a reminder to check again next month',
    ],
  ],
  [
    /call|phone|appointment|book .*(doctor|dentist)|dentist|doctor/i,
    [
      'Find the phone number',
      'Write down what you need to say',
      'Pick a time you’re free',
      'Make the call (it can be short)',
      'Put it in your calendar',
    ],
  ],
  [
    /groceries|grocery|shopping/i,
    ['Check the fridge for 2 minutes', 'Write the list', 'Pick store or delivery', 'Shop', 'Put the cold stuff away first'],
  ],
  [/meal ?prep|cook/i, ['Pick one recipe', 'Check you have the ingredients', 'Get out everything you need', 'Cook it', 'Pack it into containers']],
  [
    /pack(ing)?\b/i,
    ['Get the suitcase out', 'Lay out clothes for each day', 'Pack toiletries and chargers', 'Pack the clothes', 'Check for ID, wallet, keys'],
  ],
  [
    /homework|study|essay|paper|assignment|project|report/i,
    [
      'Open the file or the assignment',
      'Read what’s actually being asked',
      'Write the first messy sentence',
      'Work for 15 minutes',
      'Take a break, then 15 more',
    ],
  ],
  [/return|post office|mail/i, ['Find the item and the receipt', 'Box or bag it up', 'Print or pull up the label', 'Drop it off']],
  [/workout|gym|exercise|run\b|walk/i, ['Put on your workout clothes', 'Fill your water bottle', 'Do 5 minutes', 'Keep going if it feels okay']],
]

/** Suggested tiny steps for a task title (always something, even for an unknown task). */
export function suggestSteps(title = '') {
  const match = LIBRARY.find(([re]) => re.test(title))
  if (match) return [...match[1]]
  const t = title.trim().replace(/^./, (c) => c.toLowerCase()) || 'it'
  return [`Get out what you need for ${t}`, `Do just 5 minutes of ${t}`, 'Keep going if it’s okay, or stop there', 'Put things back']
}

/** A step list ready to save on a task. */
export function makeSteps(titles) {
  return titles
    .map((title) => title.trim())
    .filter(Boolean)
    .map((title) => ({ id: uid(), title, done: false }))
}

/** "2/5" progress, or null when there are no steps. */
export function stepProgress(task) {
  if (!task?.steps?.length) return null
  return { done: task.steps.filter((s) => s.done).length, total: task.steps.length }
}
