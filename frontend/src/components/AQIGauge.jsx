import { useMemo } from 'react'
import { classifyAQI } from '../utils/aqi'

export default function AQIGauge({ aqi, size = 220 }) {
  const cat = classifyAQI(aqi)
  const clampedAQI = Math.min(aqi, 500)
  const pct = clampedAQI / 500

  // SVG arc math
  const cx = size / 2
  const cy = size / 2 + 10
  const r = (size / 2) - 20
  const circumference = Math.PI * r  // Half circle
  const offset = circumference * (1 - pct)

  // Gradient id
  const gid = useMemo(() => `gauge-grad-${Math.random().toString(36).substr(2, 6)}`, [])

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.6 + 30} viewBox={`0 0 ${size} ${size * 0.6 + 30}`}>
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E400" />
            <stop offset="25%" stopColor="#FFFF00" />
            <stop offset="50%" stopColor="#FF7E00" />
            <stop offset="75%" stopColor="#FF0000" />
            <stop offset="100%" stopColor="#7E0023" />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <path
          d={`M ${20} ${cy} A ${r} ${r} 0 0 1 ${size - 20} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Colored arc */}
        <path
          d={`M ${20} ${cy} A ${r} ${r} 0 0 1 ${size - 20} ${cy}`}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
        />

        {/* Tick marks */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t, i) => {
          const angle = Math.PI * t
          const tx = cx - r * Math.cos(angle)
          const ty = cy - r * Math.sin(angle)
          const ox = cx - (r - 18) * Math.cos(angle)
          const oy = cy - (r - 18) * Math.sin(angle)
          return (
            <line key={i} x1={tx} y1={ty} x2={ox} y2={oy}
              stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          )
        })}

        {/* Needle */}
        {(() => {
          const angle = Math.PI * pct
          const nx = cx - (r - 5) * Math.cos(angle)
          const ny = cy - (r - 5) * Math.sin(angle)
          return (
            <>
              <line x1={cx} y1={cy} x2={nx} y2={ny}
                stroke="white" strokeWidth="2" strokeLinecap="round"
                style={{ transition: 'all 1.4s cubic-bezier(0.4,0,0.2,1)', transformOrigin: `${cx}px ${cy}px` }}
              />
              <circle cx={cx} cy={cy} r="5" fill="white" />
            </>
          )
        })()}

        {/* Center text */}
        <text x={cx} y={cy - 12} textAnchor="middle"
          fill="white" fontSize={size * 0.14} fontWeight="700" fontFamily="Syne, sans-serif"
          style={{ transition: 'all 0.5s ease' }}>
          {Math.round(aqi)}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle"
          fill={cat.color} fontSize={size * 0.055} fontFamily="DM Sans, sans-serif" fontWeight="500">
          AQI
        </text>

        {/* Label */}
        <text x={cx} y={cy + 26} textAnchor="middle"
          fill={cat.color} fontSize={size * 0.048} fontFamily="DM Sans, sans-serif">
          {cat.label}
        </text>

        {/* Scale labels */}
        <text x={18} y={cy + 24} fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="JetBrains Mono">0</text>
        <text x={size - 28} y={cy + 24} fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="JetBrains Mono">500</text>
      </svg>
    </div>
  )
}
