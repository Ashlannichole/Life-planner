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
    </g>
  )
}

function Leaf({ x, y, side, size = 1, color }) {
  const dir = side === 'left' ? -1 : 1
  const d = `M${x} ${y} q ${dir * 14 * size} ${-4 * size} ${dir * 20 * size} ${-14 * size} q ${dir * -12 * size} ${-2 * size} ${dir * -20 * size} ${14 * size}z`
  return <path d={d} fill={color} />
}

function Flower({ type, x, y, scale = 1 }) {
  const { petal, center, petals, shape } = type
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
        {stage === 5 && <Flower type={type} x={60} y={type.shape === 'spike' ? stemTop - 12 : stemTop - 6} scale={1.15} />}
      </g>
      <Pot pot={pot} />
    </svg>
  )
}
