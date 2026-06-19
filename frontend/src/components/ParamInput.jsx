import { PARAM_LABELS } from '../utils/aqi'

export default function ParamInput({ name, value, onChange }) {
  const meta = PARAM_LABELS[name]
  if (!meta) return null
  const pct = ((value - meta.min) / (meta.max - meta.min)) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <span>{meta.icon}</span>
          {meta.label}
        </label>
        <span className="font-mono text-sm font-bold text-cyan-400">
          {value} <span className="text-slate-500 font-normal text-xs">{meta.unit}</span>
        </span>
      </div>

      {/* Number input */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="range"
            min={meta.min}
            max={meta.max}
            step={meta.step}
            value={value}
            onChange={(e) => onChange(name, parseFloat(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #22d3ee ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
            }}
          />
        </div>
        <input
          type="number"
          min={meta.min}
          max={meta.max}
          step={meta.step}
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v)) onChange(name, Math.min(meta.max, Math.max(meta.min, v)))
          }}
          className="w-20 text-right text-sm font-mono bg-transparent border rounded px-2 py-1 text-white focus:outline-none focus:border-cyan-400"
          style={{ borderColor: 'rgba(34,211,238,0.2)' }}
        />
      </div>
    </div>
  )
}
