import clsx from 'clsx'

export default function StatCard({ label, value, unit, color, icon, subtitle }) {
  return (
    <div className="card-hover glow-border rounded-xl p-4" style={{ background: 'var(--bg-card)' }}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {subtitle && (
          <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{
            background: 'rgba(34,211,238,0.1)', color: 'rgba(34,211,238,0.8)'
          }}>{subtitle}</span>
        )}
      </div>
      <div className="mt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-display font-bold" style={{ color: color || 'white' }}>
            {value}
          </span>
          {unit && <span className="text-xs text-slate-400 font-mono">{unit}</span>}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}
