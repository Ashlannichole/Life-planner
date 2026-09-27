// Tiny synthesized sounds — soft and short, no audio files needed.
let ctx = null

function audio() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx ||= new AC()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(ac, freq, start, duration, volume = 0.07, type = 'sine') {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

export function playCheck() {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  tone(ac, 660, t, 0.18)
  tone(ac, 990, t + 0.08, 0.28)
}

export function playChime() {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  ;[523, 659, 784, 1047].forEach((f, i) => tone(ac, f, t + i * 0.11, 0.5, 0.06))
}
