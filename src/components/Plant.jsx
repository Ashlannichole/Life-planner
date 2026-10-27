import { plantType, potType, stageIndex } from '../lib/plant.js'

// Drawn in a 120×160 box. The pot sits at the bottom; the plant grows up
// from the soil line at y=118 as it moves through its stages.

function Pot({ pot }) {
  return (
    <g>
      <path d="M30 118h60l-7 36H37z" fill={pot.color} />
      <rect x="26" y="112" width="68" height="10" rx="4" fill={pot.rim} />
      <ellipse cx="60" cy="113" rx="30" ry="3.5" fill="#6b4f3a" opacity="0.85" />
      {pot.speckled &&
        [
          [44, 130],
          [58, 138],
          [72, 128],
          [50, 146],
          [70, 146],
          [64, 124],
        ].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="#b5a58c" />)}
      {pot.stripes &&
        [0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${30 + i * 16} 122 l10 0 l-12 32 l-8 0z`} fill={pot.stripes} opacity="0.9" clipPath="url(#pot-clip)" />
        ))}
      {pot.slime && (
        <path d="M27 120 h66 v3 q-3 0 -4 6 q-1 4 -3 0 q-1 -5 -6 -6 h-14 q-3 1 -3 8 q-1 4 -3 0 q0 -7 -5 -8 h-18 q-3 0 -4 4 q-1 3 -3 0 z" fill={pot.slime} />
      )}
    </g>
  )
}

function Leaf({ x, y, side, size = 1, color }) {
  const dir = side === 'left' ? -1 : 1
  const d = `M${x} ${y} q ${dir * 14 * size} ${-4 * size} ${dir * 20 * size} ${-14 * size} q ${dir * -12 * size} ${-2 * size} ${dir * -20 * size} ${14 * size}z`
  return <path d={d} fill={color} />
}

// A row of little hanging bells on an arching stem (snowdrop, nightshade).
function Bells({ type, x, y }) {
  const bells = [
    [x + 9, y + 6, 1.15],
    [x + 20, y + 13, 1],
    [x + 28, y + 24, 0.85],
  ]
  return (
    <g>
      <path d={`M${x} ${y + 6} q 18 -16 30 12`} stroke={type.leaf} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {bells.map(([bx, by, k], i) => (
        <g key={i}>
          <path
            d={`M${bx - 7 * k} ${by + 14 * k} q 0 -16 ${7 * k} -16 q ${7 * k} 0 ${7 * k} 16 q ${-3.5 * k} -3 ${-7 * k} 0 q ${-3.5 * k} -3 ${-7 * k} 0z`}
            fill={type.petal}
            stroke={type.center}
            strokeWidth="1"
          />
          <circle cx={bx} cy={by + 14 * k} r={1.6 * k} fill={type.center} />
        </g>
      ))}
      {type.berries &&
        [
          [x - 8, y + 10],
          [x - 3, y + 17],
          [x - 12, y + 18],
        ].map(([bx, by], i) => (
          <g key={`b${i}`}>
            <circle cx={bx} cy={by} r="4.2" fill={type.berries} />
            <circle cx={bx - 1.4} cy={by - 1.4} r="1.1" fill="#ffffff" opacity="0.6" />
          </g>
        ))}
    </g>
  )
}

const heartPath = (cx, cy, s) =>
  `M${cx} ${cy + 4 * s} c ${-6 * s} ${-4 * s} ${-6 * s} ${-10 * s} ${-2 * s} ${-10 * s} c ${1.5 * s} 0 ${2 * s} ${1 * s} ${2 * s} ${2 * s} c 0 ${-1 * s} ${0.5 * s} ${-2 * s} ${2 * s} ${-2 * s} c ${4 * s} 0 ${4 * s} ${6 * s} ${-2 * s} ${10 * s}z`

function Flower({ type, x, y, scale = 1 }) {
  const { petal, center, petals, shape } = type
  if (shape === 'bell') return <Bells type={type} x={x} y={y} />
  if (shape === 'heart') {
    return (
      <g>
        <path d={`M${x} ${y + 4} q 18 -16 34 14`} stroke={type.leaf} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {[
          [x + 8, y + 2, 1.7],
          [x + 18, y + 5, 1.5],
          [x + 26, y + 12, 1.3],
          [x + 31, y + 21, 1.1],
        ].map(([hx, hy, s], i) => (
          <g key={i}>
            <path d={heartPath(hx, hy + 6 * s, s)} fill={petal} />
            <path d={`M${hx} ${hy + 10 * s} l0 ${3 * s}`} stroke={center} strokeWidth="1.6" strokeLinecap="round" />
          </g>
        ))}
      </g>
    )
  }
  if (shape === 'clover') {
    return (
      <g>
        {[0, 120, 240].map((a) => (
          // Point at the middle, lobes outward.
          <path key={a} d={heartPath(x, y - 6 * scale, 1.5 * scale)} fill={petal} transform={`rotate(${a} ${x} ${y})`} />
        ))}
        <circle cx={x} cy={y} r={2.2 * scale} fill={center} />
      </g>
    )
  }
  if (shape === 'burst') {
    return (
      <g>
        {Array.from({ length: 16 }, (_, i) => {
          const a = (Math.PI * 2 * i) / 16
          const r = (i % 2 ? 13 : 16) * scale
          const ex = x + Math.cos(a) * r
          const ey = y + Math.sin(a) * r
          return (
            <g key={i}>
              <path d={`M${x} ${y} L${ex} ${ey}`} stroke={i % 3 ? petal : center} strokeWidth="1.2" />
              <circle cx={ex} cy={ey} r={2.4 * scale} fill={i % 3 ? petal : center} />
            </g>
          )
        })}
        <circle cx={x} cy={y} r={3 * scale} fill="#f4c430" />
      </g>
    )
  }
  if (shape === 'holly') {
    // A spiky leaf pointing right from its stem end.
    const leafPath = 'M0 0 q 3 -6 6 -5 l 2 -4 l 3 4 l 4 -4 l 2 5 l 5 -3 l 0 6 l 4 1 l -4 3 l 1 5 l -5 -2 l -3 4 l -3 -4 l -4 3 l -2 -4 l -4 1z'
    return (
      <g>
        <path d={leafPath} fill={petal} transform={`translate(${x} ${y + 4}) rotate(-160) scale(${1.15 * scale})`} />
        <path d={leafPath} fill={petal} transform={`translate(${x} ${y + 4}) rotate(-20) scale(${1.15 * scale})`} />
        <path d={leafPath} fill={type.leaf} opacity="0.75" transform={`translate(${x} ${y + 4}) rotate(-90) scale(${0.9 * scale})`} />
        {[
          [x - 4.5, y + 1],
          [x + 4.5, y + 1],
          [x, y - 4],
        ].map(([bx, by], i) => (
          <g key={i}>
            <circle cx={bx} cy={by} r={4.4 * scale} fill={center} />
            <circle cx={bx - 1.4} cy={by - 1.4} r="1.2" fill="#ffffff" opacity="0.7" />
          </g>
        ))}
      </g>
    )
  }
  if (shape === 'bat') {
    return (
      <g>
        {[-1, 1].map((d) => (
          <path
            key={d}
            d={`M${x} ${y} q ${d * 10} -18 ${d * 24} -10 q ${d * -4} 4 ${d * -2} 8 q ${d * -6} -2 ${d * -8} 4 q ${d * -6} -3 ${d * -8} 4 q ${d * -4} -4 ${d * -6} -6z`}
            fill={petal}
          />
        ))}
        {[-14, -6, 4, 12].map((dx, i) => (
          <path key={i} d={`M${x} ${y + 2} q ${dx} 10 ${dx * 1.4} 26`} stroke={petal} strokeWidth="0.9" fill="none" opacity="0.8" />
        ))}
        <circle cx={x} cy={y + 1} r={4.5 * scale} fill={center} />
        <circle cx={x - 1.6} cy={y} r="0.9" fill="#fff" opacity="0.8" />
        <circle cx={x + 1.6} cy={y} r="0.9" fill="#fff" opacity="0.8" />
      </g>
    )
  }
  if (shape === 'spike') {
    return (
      <g>
        {Array.from({ length: 7 }, (_, i) => (
          <ellipse key={i} cx={x + (i % 2 ? 3 : -3) * scale} cy={y + i * 4.5 * scale} rx={3.4 * scale} ry={4.2 * scale} fill={i % 2 ? petal : center} />
        ))}
      </g>
    )
  }
  if (shape === 'cup') {
    return (
      <g>
        <ellipse cx={x - 6 * scale} cy={y + 2} rx={7 * scale} ry={11 * scale} fill={center} transform={`rotate(-14 ${x} ${y})`} />
        <ellipse cx={x + 6 * scale} cy={y + 2} rx={7 * scale} ry={11 * scale} fill={center} transform={`rotate(14 ${x} ${y})`} />
        <ellipse cx={x} cy={y} rx={7.5 * scale} ry={12 * scale} fill={petal} />
      </g>
    )
  }
  const r = shape === 'long' ? 11 : 8
  return (
    <g>
      {Array.from({ length: petals }, (_, i) => {
        const a = (360 / petals) * i
        return shape === 'long' ? (
          <ellipse key={i} cx={x} cy={y - r * scale} rx={3.6 * scale} ry={r * 0.9 * scale} fill={petal} transform={`rotate(${a} ${x} ${y})`} />
        ) : (
          <circle key={i} cx={x} cy={y - r * scale} r={7 * scale} fill={petal} transform={`rotate(${a} ${x} ${y})`} />
        )
      })}
      <circle cx={x} cy={y} r={(shape === 'long' ? 6.5 : 5) * scale} fill={center} />
    </g>
  )
}

export default function Plant({ typeId, potId, water, stage: stageOverride, size = 120, className = '' }) {
  const type = plantType(typeId)
  const pot = potType(potId)
  const stage = stageOverride ?? stageIndex(water)
  const leaf = type.leaf
  const stemTop = [112, 98, 86, 68, 48, 40][stage]

  if (type.shape === 'tree' && stage >= 2) {
    return (
      <svg
        className={`plant-svg ${className}`}
        viewBox="0 0 120 160"
        width={size}
        height={(size * 160) / 120}
        role="img"
        aria-label={`${type.name}, ${['seed', 'sprout', 'seedling', 'growing', 'budding', 'in full bloom'][stage]}`}
      >
        <PotClip />
        <g className="sway">
          <Tree type={type} grown={stage} />
        </g>
        <Pot pot={pot} />
      </svg>
    )
  }

  return (
    <svg
      className={`plant-svg ${className}`}
      viewBox="0 0 120 160"
      width={size}
      height={(size * 160) / 120}
      role="img"
      aria-label={`${type.name}, ${['seed', 'sprout', 'seedling', 'growing', 'budding', 'in full bloom'][stage]}`}
    >
      <g className="sway">
        {stage === 0 && (
          <>
            <ellipse cx="60" cy="108" rx="6" ry="4.5" fill="#9a7250" />
            <path d="M60 104 q 1 -5 5 -6" stroke={leaf} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </>
        )}
        {stage > 0 && <path d={`M60 116 C 58 ${(116 + stemTop) / 2}, 62 ${(116 + stemTop) / 2}, 60 ${stemTop}`} stroke={leaf} strokeWidth="3.2" fill="none" strokeLinecap="round" />}
        {stage === 1 && (
          <>
            <Leaf x={60} y={100} side="left" size={0.55} color={leaf} />
            <Leaf x={60} y={100} side="right" size={0.55} color={leaf} />
          </>
        )}
        {stage >= 2 && (
          <>
            <Leaf x={60} y={102} side="left" size={0.8} color={leaf} />
            <Leaf x={60} y={96} side="right" size={0.8} color={leaf} />
          </>
        )}
        {stage >= 3 && (
          <>
            <Leaf x={60} y={84} side="left" size={0.95} color={leaf} />
            <Leaf x={60} y={78} side="right" size={0.95} color={leaf} />
          </>
        )}
        {stage >= 4 && (
          <>
            <Leaf x={60} y={66} side="left" size={0.75} color={leaf} />
            <Leaf x={60} y={62} side="right" size={0.75} color={leaf} />
          </>
        )}
        {stage === 4 && <ellipse cx="60" cy={stemTop - 4} rx="6" ry="9" fill={type.petal} opacity="0.9" />}
        {stage === 5 && <Flower type={type} x={type.shape === 'bell' || type.shape === 'heart' ? 50 : 60} y={type.shape === 'spike' ? stemTop - 12 : stemTop - 6} scale={1.15} />}
      </g>
      <PotClip />
      <Pot pot={pot} />
    </svg>
  )
}

// Keeps striped pots' stripes inside the pot.
function PotClip() {
  return (
    <defs>
      <clipPath id="pot-clip">
        <path d="M30 118h60l-7 36H37z" />
      </clipPath>
    </defs>
  )
}

// A little fir that gets taller each stage; dressed up with lights and a star in full bloom.
function Tree({ type, grown }) {
  const h = [0, 0, 34, 52, 66, 78][grown]
  const top = 112 - h
  const layers = 3
  return (
    <g>
      <rect x="57" y="104" width="6" height="10" fill="#7a5233" />
      {Array.from({ length: layers }, (_, i) => {
        const yTop = top + (i * h) / (layers + 1)
        const yBottom = top + ((i + 2) * h) / (layers + 1) + 4
        const half = 10 + i * 8 + (grown - 2) * 2
        return <path key={i} d={`M60 ${yTop} L${60 + half} ${yBottom} L${60 - half} ${yBottom}z`} fill={type.petal} />
      })}
      {grown === 5 && (
        <>
          {[
            [52, 66, '#e63946'],
            [68, 74, '#3a86ff'],
            [56, 86, '#f4c430'],
            [72, 94, '#ff6fb5'],
            [46, 96, '#2a9d8f'],
            [62, 58, '#ff6fb5'],
          ].map(([cx, cy, c], i) => (
            <circle key={i} cx={cx} cy={cy} r="2.6" fill={c} />
          ))}
          <path d={`M60 ${top - 9} l2.6 5.4 5.9 .9 -4.3 4.1 1 5.9 -5.2 -2.8 -5.2 2.8 1 -5.9 -4.3 -4.1 5.9 -.9z`} fill={type.center} />
        </>
      )}
    </g>
  )
}
