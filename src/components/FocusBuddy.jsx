import { useEffect, useState } from 'react'
import { startAmbient, stopAmbient } from '../lib/sound.js'
import { useStore } from '../store.jsx'
import Plant from './Plant.jsx'

const CHEERS = [
  'I’m right here with you.',
  'Tiny steps still count.',
  'You started. That’s the hardest part.',
  'Sip of water? I’ll wait.',
  'Look at you go 🌱',
  'No rush. Just this one thing.',
  'I’m working on growing. You work on that.',
  'Halfway feels far, then it’s done.',
]

const SOUNDS = [
  { id: null, label: 'Quiet' },
  { id: 'rain', label: '🌧️ Rain' },
  { id: 'brown', label: '🟤 Brown noise' },
]

/**
 * Plus: "Do it with me". Body doubling without a stranger on camera: your plant sits
 * with you, says something kind now and then, and can play rain or brown noise.
 */
export default function FocusBuddy() {
  const { state } = useStore()
  const plant = state.plant.current
  // Starts quiet each time: phones only play sound after a tap.
  const [sound, setSound] = useState(null)
  const [cheer, setCheer] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCheer((n) => n + 1), 45000)
    return () => clearInterval(id)
  }, [])

  // Sound plays while focus mode is open, and stops when it closes.
  useEffect(() => {
    if (sound) startAmbient(sound)
    else stopAmbient()
    return () => stopAmbient()
  }, [sound])

  return (
    <div className="buddy">
      <div className="buddy-plant">
        <Plant typeId={plant.typeId} potId={plant.potId} water={plant.water} size={64} />
      </div>
      <div className="buddy-bubble" key={cheer} aria-live="polite">
        {CHEERS[cheer % CHEERS.length]}
      </div>
      <div className="chips buddy-sounds">
        {SOUNDS.map((s) => (
          <button key={s.label} className={`chip ${sound === s.id ? 'on' : ''}`} onClick={() => setSound(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
