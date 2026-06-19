import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Wind, Activity, BarChart3, TrendingUp, Settings, Sliders } from 'lucide-react'
import clsx from 'clsx'
import { getHealth } from '../utils/api'

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Wind },
  { to: '/predictor', label: 'Predictor', icon: Activity },
  { to: '/forecast', label: 'Forecast', icon: TrendingUp },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin', label: 'Admin', icon: Sliders },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const [alive, setAlive] = useState(false)

  useEffect(() => {
    let isMounted = true
    const checkHealth = async () => {
      try {
        const res = await getHealth()
        if (isMounted) setAlive(res.status === 'healthy')
      } catch (err) {
        if (isMounted) setAlive(false)
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 10000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{
      background: 'rgba(8,13,26,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(34,211,238,0.1)',
    }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(34,211,238,0.05))',
            border: '1px solid rgba(34,211,238,0.3)',
          }}>
            <Wind size={16} className="text-cyan-400" />
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">
            AQI<span className="text-cyan-400">Predictor</span>
          </span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  active
                    ? 'text-cyan-400 bg-cyan-400/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon size={14} />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Status dot */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className={clsx(
            "w-2 h-2 rounded-full transition-all duration-300",
            alive ? "bg-green-400 animate-pulse" : "bg-red-400"
          )} />
          {alive ? 'API Live' : 'API Offline'}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all',
                active ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-400 hover:text-white'
              )}
            >
              <Icon size={12} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
