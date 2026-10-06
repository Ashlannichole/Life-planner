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

// ---- Plus: background sounds for "Do it with me" (made on the fly, no files)

let ambient = null

function noiseBuffer(ac, kind) {
  const length = ac.sampleRate * 4
  const buffer = ac.createBuffer(1, length, ac.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    if (kind === 'brown') {
      // Brown noise: a deep, steady rumble.
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    } else {
      data[i] = white
    }
  }
  return buffer
}

/** Start a soft loop: 'rain' or 'brown'. Stops any loop already playing. */
export function startAmbient(kind) {
  stopAmbient()
  const ac = audio()
  if (!ac || !kind) return
  const source = ac.createBufferSource()
  source.buffer = noiseBuffer(ac, kind)
  source.loop = true
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0, ac.currentTime)
  gain.gain.linearRampToValueAtTime(kind === 'rain' ? 0.06 : 0.22, ac.currentTime + 1.5)
  let node = source
  if (kind === 'rain') {
    // Rain: hiss shaped to sound like a shower on the window.
    const band = ac.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 1400
    band.Q.value = 0.6
    const low = ac.createBiquadFilter()
    low.type = 'lowpass'
    low.frequency.value = 5000
    node = node.connect(band).connect(low)
  }
  node.connect(gain).connect(ac.destination)
  source.start()
  ambient = { source, gain, ac }
}

export function stopAmbient() {
  if (!ambient) return
  const { source, gain, ac } = ambient
  ambient = null
  gain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.4)
  source.stop(ac.currentTime + 0.45)
}
