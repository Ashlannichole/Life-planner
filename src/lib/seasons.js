// Plus: seasonal themes. The accent colors change with the month on their own:
// pumpkin in October, holly in December, pink for February.

export const SEASONAL_THEMES = [
  { id: 'season-1', month: 1, name: 'Fresh start', emoji: '❄️', light: '#4f7fa8', dark: '#93bde0', softLight: '#e3edf6', softDark: '#26364a' },
  { id: 'season-2', month: 2, name: 'Valentine', emoji: '💝', light: '#c0567a', dark: '#eb9bb7', softLight: '#f9e1ea', softDark: '#4a2a36' },
  { id: 'season-3', month: 3, name: 'Spring sprout', emoji: '🌱', light: '#4f9a5c', dark: '#8fd09b', softLight: '#e0f1e2', softDark: '#28402c' },
  { id: 'season-4', month: 4, name: 'Pastel', emoji: '🐣', light: '#8a6fc0', dark: '#c3b0ec', softLight: '#efe8fa', softDark: '#373052' },
  { id: 'season-5', month: 5, name: 'Bloom', emoji: '🌸', light: '#cc6f6f', dark: '#f0a9a9', softLight: '#fbe6e4', softDark: '#4a2e2e' },
  { id: 'season-6', month: 6, name: 'Sunshine', emoji: '☀️', light: '#c08a1e', dark: '#f0c56b', softLight: '#fbf0d6', softDark: '#4a3b1c' },
  { id: 'season-7', month: 7, name: 'Fireworks', emoji: '🎆', light: '#c04848', dark: '#ef9393', softLight: '#fbe3e3', softDark: '#4a2828' },
  { id: 'season-8', month: 8, name: 'Beach day', emoji: '🏖️', light: '#2f8f8a', dark: '#7fd0ca', softLight: '#dcf2f0', softDark: '#1f3f3d' },
  { id: 'season-9', month: 9, name: 'Apple picking', emoji: '🍎', light: '#b4513f', dark: '#e8988a', softLight: '#f8e3de', softDark: '#46291f' },
  { id: 'season-10', month: 10, name: 'Pumpkin', emoji: '🎃', light: '#d0711f', dark: '#f5ab68', softLight: '#fce8d4', softDark: '#4c3219' },
  { id: 'season-11', month: 11, name: 'Harvest', emoji: '🍂', light: '#a5672b', dark: '#dfa871', softLight: '#f5e7d6', softDark: '#43311f' },
  { id: 'season-12', month: 12, name: 'Holly', emoji: '🎄', light: '#2f7a4d', dark: '#7cc499', softLight: '#dcefe3', softDark: '#203c2b' },
]

/** This month's seasonal theme for a day key. */
export function seasonFor(day) {
  return SEASONAL_THEMES[Number(day.slice(5, 7)) - 1]
}
