import { hasPlus } from '../lib/plus.js'
import { themeFor } from '../lib/seasons.js'
import { useStore } from '../store.jsx'

/**
 * Plus: the holiday theme for today, or null when themes or decorations are off.
 * Decorations are lights or charms on a string, little critters peeking over the
 * calendar, and a few things drifting in the background.
 */
export function useDecor() {
  const { state, today } = useStore()
  if (!state.settings.seasonalTheme || !hasPlus(state) || state.settings.themeDecor === false) return null
  return themeFor(today, state.specialDays)
}

// ---------- the string of lights / charms

function Charm({ shape, color }) {
  switch (shape) {
    case 'heart':
      return <path d="M12 21 C3 14 2 8 6 5 C9 3 12 5 12 8 C12 5 15 3 18 5 C22 8 21 14 12 21 Z" fill={color} />
    case 'shamrock':
      return (
        <g fill={color}>
          <circle cx="12" cy="8" r="4.2" />
          <circle cx="7.6" cy="14" r="4.2" />
          <circle cx="16.4" cy="14" r="4.2" />
          <path d="M12 14 Q13 19 15 22" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      )
    case 'egg':
      return (
        <g>
          <ellipse cx="12" cy="13" rx="6.5" ry="8.5" fill={color} />
          <path d="M6 12 Q9 10 12 12 T18 12" stroke="#fff" strokeWidth="1.4" fill="none" opacity="0.8" />
          <circle cx="10" cy="16" r="1.1" fill="#fff" opacity="0.8" />
          <circle cx="14.5" cy="16.5" r="1.1" fill="#fff" opacity="0.8" />
        </g>
      )
    case 'flag':
      return <path d="M3 3 H21 L12 21 Z" fill={color} stroke="rgba(0,0,0,0.08)" />
    case 'leaf':
      return (
        <g>
          <path d="M12 3 C19 8 19 16 12 22 C5 16 5 8 12 3 Z" fill={color} />
          <path d="M12 6 V20" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
        </g>
      )
    case 'star':
      return <path d={starPath(12, 13, 9, 4)} fill={color} />
    default:
      // A Christmas-light bulb with a little cap.
      return (
        <g>
          <rect x="9.5" y="2" width="5" height="4" rx="1" fill="#6b6b6b" />
          <path d="M12 6 C17 8 18 14 15.5 19 C14.5 21 9.5 21 8.5 19 C6 14 7 8 12 6 Z" fill={color} />
          <ellipse cx="10.4" cy="11" rx="1.3" ry="2.6" fill="#fff" opacity="0.55" />
        </g>
      )
  }
}

/** A string hung across the top of something, with twinkling lights or charms on it. */
export function Garland({ theme, count = 11 }) {
  const decor = theme?.decor
  if (!decor?.garland) return null
  const glow = decor.garland === 'bulb' || decor.garland === 'star'
  return (
    <div className={`garland ${glow ? 'glow' : ''}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="garland-link">
          <svg className="garland-wire" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0 3 Q50 19 100 3" fill="none" stroke="currentColor" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
          </svg>
          <svg
            className="garland-charm"
            viewBox="0 0 24 24"
            style={{ animationDelay: `${(i % 5) * 0.37}s`, '--glow': decor.charms[i % decor.charms.length] }}
          >
            <Charm shape={decor.garland} color={decor.charms[i % decor.charms.length]} />
          </svg>
        </span>
      ))}
    </div>
  )
}

// ---------- critters

function starPath(cx, cy, outer, inner, points = 5) {
  const pts = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer
    const a = (Math.PI / points) * i - Math.PI / 2
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return `M${pts.join('L')}Z`
}

const INK = '#2b2533'

function Eyes({ y = 34, gap = 9, r = 3.4, cx = 32 }) {
  return (
    <g className="critter-eyes">
      {[cx - gap, cx + gap].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 1.15} fill={INK} />
          <circle cx={x + r * 0.35} cy={y - r * 0.4} r={r * 0.38} fill="#fff" />
        </g>
      ))}
    </g>
  )
}

const Cheeks = ({ y = 41, gap = 15, color = '#ff8fab' }) => (
  <g fill={color} opacity="0.55">
    <ellipse cx={32 - gap} cy={y} rx="3.6" ry="2.2" />
    <ellipse cx={32 + gap} cy={y} rx="3.6" ry="2.2" />
  </g>
)

const Smile = ({ y = 41, w = 5 }) => (
  <path d={`M${32 - w} ${y} Q32 ${y + w * 0.9} ${32 + w} ${y}`} stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
)

/** Little hands gripping the edge of whatever the critter peeks over. */
const Paws = ({ color }) => (
  <g fill={color} stroke="rgba(0,0,0,0.18)" strokeWidth="1">
    <ellipse cx="18" cy="60" rx="6" ry="4" />
    <ellipse cx="46" cy="60" rx="6" ry="4" />
  </g>
)

// A rounded body that ends at the bottom edge (the rest is hidden behind the card).
const Blob = ({ color, top = 14 }) => (
  <path d={`M8 64 V${top + 22} C8 ${top + 4} 18 ${top} 32 ${top} C46 ${top} 56 ${top + 4} 56 ${top + 22} V64 Z`} fill={color} />
)

function Monster({ color = '#9b7be0', horn = '#ffe08a', oneEye = true }) {
  return (
    <>
      <path d="M17 20 L14 7 L24 15 Z" fill={horn} />
      <path d="M47 20 L50 7 L40 15 Z" fill={horn} />
      <Blob color={color} top={12} />
      {oneEye ? (
        <g className="critter-eyes">
          <circle cx="32" cy="32" r="9" fill="#fff" />
          <circle cx="33" cy="33" r="5" fill={INK} />
          <circle cx="35" cy="31" r="1.6" fill="#fff" />
        </g>
      ) : (
        <Eyes y={31} />
      )}
      <path d="M25 45 Q32 50 39 45" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M28 46.5 L29.5 50 L31 47.5 Z M33 47.5 L34.5 50 L36 46.5 Z" fill="#fff" />
      <Paws color={color} />
    </>
  )
}

function Pumpkin({ carved }) {
  return (
    <>
      <path d="M31 14 Q30 7 35 5" stroke="#5a8f29" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <ellipse cx="20" cy="40" rx="13" ry="22" fill="#f07d1a" />
      <ellipse cx="44" cy="40" rx="13" ry="22" fill="#f07d1a" />
      <ellipse cx="32" cy="40" rx="15" ry="24" fill="#ff9330" />
      {carved ? (
        <g fill="#ffd166" className="critter-eyes">
          <path d="M20 34 L25 26 L30 34 Z" />
          <path d="M34 34 L39 26 L44 34 Z" />
          <path d="M18 43 Q32 56 46 43 L42 45 L39 42 L35 46 L32 43 L29 46 L25 42 L22 45 Z" />
        </g>
      ) : (
        <>
          <Eyes y={36} gap={8} />
          <Cheeks y={43} gap={13} />
          <Smile y={44} w={4} />
        </>
      )}
    </>
  )
}

function Ghost() {
  return (
    <>
      <Blob color="#fbfbff" top={8} />
      <path d="M8 64 V30 C8 12 18 8 32 8 C46 8 56 12 56 30 V64" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2" />
      <Eyes y={30} gap={8} r={3.6} />
      <ellipse cx="32" cy="42" rx="3.5" ry="4.2" fill={INK} />
      <Cheeks y={38} gap={14} />
      <Paws color="#fbfbff" />
    </>
  )
}

function Turkey() {
  const feathers = ['#e63946', '#f4a261', '#e9c46a', '#f4a261', '#e63946']
  return (
    <>
      {feathers.map((c, i) => (
        <ellipse key={i} cx="32" cy="18" rx="6.5" ry="16" fill={c} transform={`rotate(${(i - 2) * 30} 32 38)`} />
      ))}
      <circle cx="32" cy="42" r="18" fill="#8a5a3c" />
      <Eyes y={38} gap={7} r={3} />
      <path d="M29 43 L35 43 L32 48 Z" fill="#f4a261" />
      <path d="M33 46 Q36 52 33 54 Q30 51 33 46" fill="#e63946" />
      <Paws color="#8a5a3c" />
    </>
  )
}

function Acorn() {
  return (
    <>
      <path d="M32 6 V12" stroke="#6b4423" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="32" cy="44" rx="18" ry="20" fill="#e0a96d" />
      <path d="M11 28 C11 14 53 14 53 28 C53 31 11 31 11 28 Z" fill="#7a4b26" />
      <path d="M16 22 L22 28 M24 18 L32 27 M34 18 L41 27 M44 20 L49 26" stroke="#5a3519" strokeWidth="1.5" />
      <Eyes y={40} gap={7} r={3} />
      <Cheeks y={46} gap={12} />
      <Smile y={47} w={3.5} />
    </>
  )
}

function Reindeer() {
  return (
    <>
      <g stroke="#7a4b26" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M20 22 L13 8 M16 15 L8 13 M14 11 L17 4" />
        <path d="M44 22 L51 8 M48 15 L56 13 M50 11 L47 4" />
      </g>
      <ellipse cx="14" cy="26" rx="6" ry="3.5" fill="#a0673a" transform="rotate(-25 14 26)" />
      <ellipse cx="50" cy="26" rx="6" ry="3.5" fill="#a0673a" transform="rotate(25 50 26)" />
      <Blob color="#b07444" top={16} />
      <Eyes y={34} gap={8} />
      <circle cx="32" cy="43" r="5" fill="#e63946" className="critter-glow" />
      <circle cx="30.5" cy="41.5" r="1.4" fill="#fff" opacity="0.8" />
      <Paws color="#b07444" />
    </>
  )
}

function Snowman() {
  return (
    <>
      <Blob color="#fdfdff" top={18} />
      <path d="M12 26 C12 6 52 6 52 26 Z" fill="#e63946" />
      <rect x="10" y="23" width="44" height="6" rx="3" fill="#fff" />
      <circle cx="32" cy="7" r="4.5" fill="#fff" />
      <Eyes y={37} gap={8} r={2.8} />
      <path d="M31 42 L42 44 L31 46 Z" fill="#f4a261" />
      <Cheeks y={44} gap={14} />
      <Paws color="#fdfdff" />
    </>
  )
}

function Elf() {
  return (
    <>
      <path d="M8 34 L2 26 L12 30 Z M56 34 L62 26 L52 30 Z" fill="#ffd7b5" />
      <Blob color="#ffd7b5" top={20} />
      <path d="M10 28 L36 2 L54 28 Z" fill="#2a9d8f" />
      <rect x="9" y="25" width="46" height="6" rx="3" fill="#e63946" />
      <circle cx="37" cy="3" r="3.5" fill="#f4c430" />
      <Eyes y={39} gap={8} r={3} />
      <Cheeks y={46} gap={14} />
      <Smile y={47} w={4} />
      <Paws color="#ffd7b5" />
    </>
  )
}

function Party({ color = '#9b7be0' }) {
  return (
    <>
      <Blob color={color} top={18} />
      <path d="M22 22 L32 0 L42 22 Z" fill="#f4c430" />
      <path d="M25 15 L39 15 M28 8 L36 8" stroke="#ff5d8f" strokeWidth="2.5" />
      <circle cx="32" cy="2" r="3" fill="#ff5d8f" />
      <Eyes y={37} gap={8} />
      <Cheeks y={44} gap={14} />
      <path d="M26 44 Q32 52 38 44 Z" fill={INK} />
      <Paws color={color} />
    </>
  )
}

function Star({ color }) {
  return (
    <>
      <path d={starPath(32, 38, 28, 13)} fill={color} stroke="rgba(0,0,0,0.12)" strokeWidth="1" strokeLinejoin="round" />
      <Eyes y={38} gap={6} r={2.8} />
      <Cheeks y={44} gap={10} />
      <Smile y={44} w={3} />
    </>
  )
}

function Heart({ color = '#ff5d8f' }) {
  return (
    <>
      <path d="M32 64 C10 50 4 34 10 22 C16 11 29 12 32 22 C35 12 48 11 54 22 C60 34 54 50 32 64 Z" fill={color} />
      <Eyes y={34} gap={8} />
      <Cheeks y={41} gap={14} color="#fff" />
      <Smile y={42} w={4} />
    </>
  )
}

function Lovebug() {
  return (
    <>
      <path d="M24 16 Q20 8 16 6 M40 16 Q44 8 48 6" stroke={INK} strokeWidth="2" fill="none" />
      <path
        d="M16 9 C13 6 13 3 15.5 3 C17 3 17.6 4.6 17.6 4.6 C17.6 4.6 18.4 3 20 3 C22.5 3 22 6 16 9 Z"
        fill="#ff5d8f"
        transform="translate(-3 0)"
      />
      <path
        d="M48 9 C45 6 45 3 47.5 3 C49 3 49.6 4.6 49.6 4.6 C49.6 4.6 50.4 3 52 3 C54.5 3 54 6 48 9 Z"
        fill="#ff5d8f"
        transform="translate(-1 0)"
      />
      <Blob color="#e63946" top={14} />
      <circle cx="18" cy="48" r="4" fill={INK} opacity="0.85" />
      <circle cx="46" cy="50" r="4" fill={INK} opacity="0.85" />
      <Eyes y={32} gap={8} />
      <Cheeks y={39} gap={14} color="#ffc2d4" />
      <Smile y={40} w={4} />
      <Paws color="#e63946" />
    </>
  )
}

function Shamrock() {
  return (
    <>
      <g fill="#3bb273">
        <circle cx="32" cy="20" r="14" />
        <circle cx="19" cy="40" r="14" />
        <circle cx="45" cy="40" r="14" />
      </g>
      <path d="M32 50 Q34 58 38 64" stroke="#1f7a45" strokeWidth="4" fill="none" />
      <Eyes y={34} gap={7} r={3} />
      <Cheeks y={40} gap={12} />
      <Smile y={40} w={3.5} />
    </>
  )
}

function Leprechaun() {
  return (
    <>
      <path d="M12 44 C12 60 52 60 52 44 Z" fill="#e07a2c" />
      <Blob color="#ffd7b5" top={20} />
      <path d="M12 50 C18 64 46 64 52 50 C46 56 18 56 12 50 Z" fill="#e07a2c" />
      <rect x="8" y="22" width="48" height="5" rx="2.5" fill="#1f7a45" />
      <rect x="16" y="2" width="32" height="21" rx="2" fill="#1f7a45" />
      <rect x="16" y="15" width="32" height="5" fill={INK} />
      <rect x="28" y="14" width="8" height="7" rx="1" fill="none" stroke="#f4c430" strokeWidth="2" />
      <Eyes y={36} gap={8} r={3} />
      <Cheeks y={42} gap={14} />
      <Smile y={43} w={4} />
    </>
  )
}

function PotOfGold() {
  return (
    <>
      <g fill="#f4c430" stroke="#c99a12" strokeWidth="1">
        <circle cx="22" cy="24" r="7" />
        <circle cx="34" cy="20" r="7" />
        <circle cx="44" cy="26" r="7" />
        <circle cx="28" cy="30" r="7" />
        <circle cx="40" cy="32" r="7" />
      </g>
      <path d="M8 34 H56 C56 60 50 64 32 64 C14 64 8 60 8 34 Z" fill="#2b2b33" />
      <rect x="5" y="31" width="54" height="7" rx="3.5" fill="#3a3a44" />
      <Eyes y={47} gap={8} r={3} cx={32} />
      <Cheeks y={53} gap={14} />
    </>
  )
}

function Bunny({ color = '#fdfdff' }) {
  return (
    <>
      <ellipse cx="22" cy="14" rx="6" ry="15" fill={color} transform="rotate(-10 22 14)" />
      <ellipse cx="42" cy="14" rx="6" ry="15" fill={color} transform="rotate(10 42 14)" />
      <ellipse cx="22" cy="15" rx="2.8" ry="10" fill="#ffc2d4" transform="rotate(-10 22 15)" />
      <ellipse cx="42" cy="15" rx="2.8" ry="10" fill="#ffc2d4" transform="rotate(10 42 15)" />
      <Blob color={color} top={22} />
      <Eyes y={40} gap={8} r={3} />
      <path d="M30 45 L34 45 L32 47.5 Z" fill="#ff8fab" />
      <Cheeks y={47} gap={14} />
      <Paws color={color} />
    </>
  )
}

function Chick() {
  return (
    <>
      <circle cx="32" cy="36" r="20" fill="#ffd93d" />
      <path d="M28 14 Q30 8 33 12 Q34 7 37 13" stroke="#f4b400" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Eyes y={33} gap={7} r={3} />
      <path d="M28 38 L36 38 L32 43 Z" fill="#f4a261" />
      <Cheeks y={40} gap={12} />
      <path d="M8 46 L15 40 L21 47 L28 40 L35 47 L42 40 L49 47 L56 41 V64 H8 Z" fill="#fdfaf2" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
    </>
  )
}

function Popsicle() {
  return (
    <>
      <path d="M14 64 V26 C14 12 50 12 50 26 V64 Z" fill="#2f5fae" />
      <path d="M14 30 C14 22 50 22 50 30 V40 H14 Z" fill="#fff" />
      <path d="M14 26 C14 12 50 12 50 26 Z" fill="#e63946" />
      <Eyes y={33} gap={8} r={3} />
      <Cheeks y={39} gap={13} />
      <Smile y={38} w={3.5} />
    </>
  )
}

function Cupcake() {
  return (
    <>
      <rect x="30" y="0" width="4" height="12" rx="1.5" fill="#7ad3ff" />
      <path d="M32 -6 C35 -2 35 1 32 2 C29 1 29 -2 32 -6 Z" fill="#f4c430" className="critter-glow" />
      <path d="M8 40 C4 30 14 22 20 24 C20 14 44 14 44 24 C50 22 60 30 56 40 Z" fill="#ffb3d1" />
      <g fill="#fff">
        <circle cx="22" cy="28" r="1.4" />
        <circle cx="38" cy="22" r="1.4" />
        <circle cx="45" cy="32" r="1.4" />
      </g>
      <path d="M10 40 H54 L50 64 H14 Z" fill="#7ad3ff" />
      <path d="M20 40 L22 64 M32 40 V64 M44 40 L42 64" stroke="#5bb8e6" strokeWidth="2" />
      <Eyes y={49} gap={8} r={3} />
      <Cheeks y={55} gap={14} />
    </>
  )
}

function Balloon() {
  return (
    <>
      <path d="M32 54 Q28 58 32 62 Q36 64 32 66" stroke="#888" strokeWidth="1.5" fill="none" />
      <ellipse cx="32" cy="30" rx="20" ry="24" fill="#ff5d8f" />
      <path d="M29 53 L35 53 L32 57 Z" fill="#ff5d8f" />
      <ellipse cx="24" cy="20" rx="4" ry="7" fill="#fff" opacity="0.4" />
      <Eyes y={30} gap={7} r={3} />
      <Cheeks y={37} gap={12} color="#fff" />
      <Smile y={37} w={4} />
    </>
  )
}

const CRITTERS = {
  monster: () => <Monster />,
  'monster-green': () => <Monster color="#7ccf6a" horn="#c9a7ff" oneEye={false} />,
  jack: () => <Pumpkin carved />,
  pumpkin: () => <Pumpkin />,
  ghost: Ghost,
  turkey: Turkey,
  acorn: Acorn,
  reindeer: Reindeer,
  snowman: Snowman,
  elf: Elf,
  party: () => <Party />,
  'party-pink': () => <Party color="#ff8fab" />,
  'star-gold': () => <Star color="#f4c430" />,
  'star-red': () => <Star color="#e63946" />,
  'star-blue': () => <Star color="#3a86ff" />,
  heart: () => <Heart />,
  'heart-pink': () => <Heart color="#ffb3c6" />,
  lovebug: Lovebug,
  shamrock: Shamrock,
  leprechaun: Leprechaun,
  gold: PotOfGold,
  bunny: () => <Bunny />,
  'bunny-gray': () => <Bunny color="#d9d4e3" />,
  chick: Chick,
  popsicle: Popsicle,
  cupcake: Cupcake,
  balloon: Balloon,
}

export function Critter({ type, size = 52, className = '' }) {
  const Draw = CRITTERS[type] || CRITTERS.monster
  return (
    <svg className={`critter ${className}`} width={size} height={size} viewBox="0 -8 64 72" aria-hidden="true">
      <Draw />
    </svg>
  )
}

/**
 * Critters peeking over the top edge of whatever comes next (a calendar, today's list).
 * `pick` rotates which ones show so different screens get different friends.
 */
export function Peekers({ theme, pick = 0, count = 2, size = 52 }) {
  const decor = theme?.decor
  if (!decor?.critters) return null
  const list = decor.critters
  const chosen = Array.from({ length: Math.min(count, list.length) }, (_, i) => list[(pick + i) % list.length])
  return (
    <div className={`peekers peekers-${chosen.length}`} style={{ height: size - 6 }} aria-hidden="true">
      {chosen.map((type, i) => (
        <Critter key={type} type={type} size={size} className={`peek peek-${i}`} />
      ))}
    </div>
  )
}

// Fixed positions (not random) so the background doesn't jump around on every render.
const BIT_SPOTS = [
  [6, 0, 13, 1.1],
  [18, 4.5, 16, 0.9],
  [31, 2, 12, 1.25],
  [44, 7, 15, 1],
  [57, 1, 14, 0.85],
  [69, 5.5, 17, 1.15],
  [81, 3, 13, 0.95],
  [93, 8, 16, 1.05],
  [12, 9.5, 18, 0.8],
  [75, 10.5, 14, 1.2],
]

/** A few things drifting through the background: leaves, snow, hearts, confetti… */
export function DecorBits({ theme }) {
  const decor = theme?.decor
  if (!decor?.bits?.length) return null
  const spots = decor.gentle ? BIT_SPOTS.slice(0, 5) : BIT_SPOTS
  return (
    <div className={`decor-bits ${decor.motion || 'fall'}`} aria-hidden="true">
      {spots.map(([left, delay, duration, scale], i) => (
        <span
          key={i}
          style={{
            left: `${left}%`,
            // Fireworks and confetti pop in place, scattered down the screen.
            top: decor.motion === 'pop' ? `${8 + ((i * 37) % 80)}%` : undefined,
            animationDelay: `${delay}s`,
            animationDuration: `${decor.motion === 'pop' ? duration / 3 : duration}s`,
            fontSize: `${scale * 1.15}rem`,
          }}
        >
          {decor.bits[i % decor.bits.length]}
        </span>
      ))}
    </div>
  )
}
