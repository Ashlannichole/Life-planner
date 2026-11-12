// The Sprout home-screen and lock-screen widget. The website works out what's next (see
// src/lib/widget.js) and the app passes it here; the widget shows it without opening Sprout.
//
// The layout function is marked 'widget': it's turned into a string at build time and run
// inside the widget, so it can only use its props, the environment and the SwiftUI views
// from @expo/ui (VStack, Text, font…), which are available there as globals. Nothing from
// this file's scope reaches it.

import { Platform } from 'react-native'

const SproutToday = (props, env) => {
  'widget'
  const dark = env.colorScheme === 'dark'
  const bg = dark ? '#1c1e1b' : '#f7f4ee'
  const ink = dark ? '#ebe8e0' : '#37362f'
  const muted = dark ? '#a3a096' : '#8a877d'
  const accent = dark ? '#86b892' : '#5d8c69'
  const next = props.next || []
  const first = next[0]
  const done = props.done || 0
  const plant = props.plant || '🌱'
  const mins = (m) => (!m ? '' : m >= 60 ? `about ${Math.round((m / 60) * 10) / 10} h` : `about ${m} min`)
  const doneText = done === 1 ? '1 done' : `${done} done`
  const nothing = props.day ? (done ? 'All done for today 🌿' : 'Nothing planned. Enjoy it!') : 'Open Sprout to plan your day'

  if (env.widgetFamily === 'accessoryInline') {
    return <Text modifiers={[containerBackground('#00000000', 'widget')]}>{first ? `🌱 ${first.title}` : `🌱 ${doneText} today`}</Text>
  }
  if (env.widgetFamily === 'accessoryCircular') {
    return (
      <VStack spacing={0} modifiers={[containerBackground('#00000000', 'widget')]}>
        <Text modifiers={[font({ size: 20 })]}>{plant}</Text>
        <Text modifiers={[font({ size: 11, weight: 'semibold' })]}>{String(done)}</Text>
      </VStack>
    )
  }
  if (env.widgetFamily === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[containerBackground('#00000000', 'widget')]}>
        <Text modifiers={[font({ size: 12, weight: 'semibold' })]}>{first ? `🌱 Next · ${doneText}` : '🌱 Sprout'}</Text>
        <Text modifiers={[font({ size: 14 }), lineLimit(2)]}>{first ? first.title : nothing}</Text>
      </VStack>
    )
  }

  const header = (
    <HStack spacing={4}>
      <Text modifiers={[font({ size: 26 })]}>{plant}</Text>
      <Spacer />
      <Text modifiers={[font({ size: 13, weight: 'bold', design: 'rounded' }), foregroundStyle(accent)]}>{doneText}</Text>
    </HStack>
  )

  if (env.widgetFamily === 'systemMedium' || env.widgetFamily === 'systemLarge') {
    return (
      <HStack alignment="top" spacing={14} modifiers={[containerBackground(bg, 'widget')]}>
        <VStack alignment="leading" spacing={4}>
          <Text modifiers={[font({ size: 40 })]}>{plant}</Text>
          <Spacer />
          <Text modifiers={[font({ size: 13, weight: 'bold', design: 'rounded' }), foregroundStyle(accent)]}>{doneText}</Text>
          <Text modifiers={[font({ size: 11 }), foregroundStyle(muted)]}>{props.left ? `${props.left} to go` : 'today'}</Text>
        </VStack>
        <VStack alignment="leading" spacing={6}>
          <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(muted)]}>{props.bedDay ? 'BED DAY 🛏️' : 'NEXT UP'}</Text>
          {next.length ? (
            next.slice(0, env.widgetFamily === 'systemLarge' ? 6 : 3).map((item, i) => (
              <HStack key={String(i)} spacing={6}>
                <Text modifiers={[font({ size: 14 }), foregroundStyle(i === 0 ? accent : muted)]}>{i === 0 ? '●' : '○'}</Text>
                <Text modifiers={[font({ size: 14, weight: i === 0 ? 'semibold' : 'regular' }), foregroundStyle(ink), lineLimit(1)]}>{item.title}</Text>
                <Spacer />
                <Text modifiers={[font({ size: 11 }), foregroundStyle(muted)]}>{item.minutes ? `${item.minutes}m` : ''}</Text>
              </HStack>
            ))
          ) : (
            <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(ink)]}>{nothing}</Text>
          )}
          <Spacer />
        </VStack>
      </HStack>
    )
  }

  return (
    <VStack alignment="leading" spacing={3} modifiers={[containerBackground(bg, 'widget')]}>
      {header}
      <Spacer />
      <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(muted)]}>{first ? (props.bedDay ? 'FROM BED' : 'NEXT TINY THING') : 'TODAY'}</Text>
      <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(ink), lineLimit(3)]}>{first ? first.title : nothing}</Text>
      {first && first.minutes ? <Text modifiers={[font({ size: 11 }), foregroundStyle(muted)]}>{mins(first.minutes)}</Text> : null}
    </VStack>
  )
}

let widget = null
function sproutWidget() {
  if (Platform.OS !== 'ios') return null
  if (!widget) {
    try {
      widget = require('expo-widgets').createWidget('SproutToday', SproutToday)
    } catch {
      widget = null
    }
  }
  return widget
}

/**
 * Show today's plan on the widget now, and switch to tomorrow's at midnight even if the
 * app isn't opened. `today` and `tomorrow` come from the website: { day, next, left, done, plant }.
 */
export function updateWidget({ today, tomorrow }) {
  const w = sproutWidget()
  if (!w || !today) return false
  const entries = [{ date: new Date(), props: today }]
  if (tomorrow?.day) {
    const [y, m, d] = tomorrow.day.split('-').map(Number)
    entries.push({ date: new Date(y, m - 1, d, 0, 0, 5), props: tomorrow })
  }
  w.updateTimeline(entries)
  return true
}
