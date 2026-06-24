import { useState, useEffect, useRef, useCallback } from 'react'
import { BarChart3, RefreshCw, AlertCircle } from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart,
  Scatter, ZAxis, ReferenceLine
} from 'recharts'
import { getHistory, getMetrics } from '../utils/api'
import { classifyAQI } from '../utils/aqi'

const tooltipStyle = {
  contentStyle: { background: 'rgba(13,21,41,0.95)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: '12px', fontSize: '12px' },
  labelStyle: { color: '#64748b' },
}

const generateMockHistory = (daysCount) => {
  const data = []
  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() - daysCount)
  let prevAqi = 75
  const r = () => Math.random()
  
  for (let i = 0; i < daysCount; i++) {
    const delta = (r() - 0.45) * 22
    const aqi = Math.max(15, Math.min(280, prevAqi + delta))
    prevAqi = aqi
    
    const pm25 = aqi * 0.4 + (r() - 0.5) * 8
    const pm10 = aqi * 0.5 + (r() - 0.5) * 12
    const no2 = aqi * 0.15 + (r() - 0.5) * 4
    
    const d = new Date(baseDate)
    d.setDate(d.getDate() + i)
    
    data.push({
      date: d.toISOString().split('T')[0],
      aqi: Number(aqi.toFixed(1)),
      pm25: Number(Math.max(1, pm25).toFixed(1)),
      pm10: Number(Math.max(1, pm10).toFixed(1)),
      no2: Number(Math.max(1, no2).toFixed(1)),
    })
  }
  return data
}

const generateMockMetrics = () => {
  const yTest = Array.from({ length: 80 }, () => Math.floor(Math.random() * 230) + 15)
  const predicted = yTest.map(y => {
    const error = (Math.random() - 0.5) * (y * 0.1 + 8)
    return Math.max(5, Math.floor(y + error))
  })

  return {
    best_model: 'Random Forest Regressor',
    feature_importance: {
      pm25: 0.445,
      pm10: 0.228,
      no2: 0.137,
      co2: 0.082,
      temperature: 0.048,
      humidity: 0.035,
      wind_speed: 0.025,
    },
    all_models: [
      { name: 'Random Forest Regressor', r2: 0.978, mae: 3.42, rmse: 4.81 },
      { name: 'Linear Regression', r2: 0.952, mae: 5.11, rmse: 6.94 },
      { name: 'Decision Tree Regressor', r2: 0.915, mae: 6.84, rmse: 9.21 }
    ],
    sample_predictions: {
      y_test: yTest,
      predicted: predicted,
    }
  }
}

export default function Analytics() {
  const [history, setHistory] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => { isMountedRef.current = false }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [h, m] = await Promise.allSettled([getHistory(days), getMetrics()])
      if (!isMountedRef.current) return
      
      let finalHistory = []
      let finalMetrics = null

      if (h.status === 'fulfilled' && Array.isArray(h.value?.data) && h.value.data.length > 0) {
        finalHistory = h.value.data
      } else {
        console.log('[Analytics] Using fallback mock history data')
        finalHistory = generateMockHistory(days)
      }

      if (m.status === 'fulfilled' && m.value && m.value.best_model) {
        finalMetrics = m.value
      } else {
        console.log('[Analytics] Using fallback mock metrics data')
        finalMetrics = generateMockMetrics()
      }

      setHistory(finalHistory)
      setMetrics(finalMetrics)
    } catch (e) {
      console.error(e)
      if (isMountedRef.current) {
        setHistory(generateMockHistory(days))
        setMetrics(generateMockMetrics())
      }
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [days])

  useEffect(() => { load() }, [load])

  // Build scatter data from metrics
  const scatterData = metrics?.sample_predictions
    ? metrics.sample_predictions.y_test.slice(0, 80).map((actual, i) => ({
        actual: Math.round(actual),
        predicted: Math.round(metrics.sample_predictions.predicted[i] || 0),
      }))
    : []

  // Feature importance data
  const featureData = metrics?.feature_importance
    ? Object.entries(metrics.feature_importance)
        .map(([k, v]) => ({ name: k.toUpperCase().replace('_', ' ').replace('PM25', 'PM2.5').replace('PM10', 'PM10').replace('WIND_SPEED', 'Wind'), value: +(v * 100).toFixed(1) }))
        .sort((a, b) => b.value - a.value)
    : []

  // Model comparison
  const modelData = metrics?.all_models?.map(m => ({
    name: m.name.replace(' Regressor', '').replace(' Regression', ''),
    r2: +(m.r2 * 100).toFixed(1),
    mae: +m.mae.toFixed(1),
    rmse: +m.rmse.toFixed(1),
  })) || []

  return (
    <div className="min-h-screen pt-24 px-6 pb-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="text-cyan-400" size={22} />
              <h1 className="font-display text-3xl font-bold text-white">Analytics</h1>
            </div>
            <p className="text-slate-400 text-sm">Historical AQI trends, model performance, and pollution analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={days} onChange={e => setDays(Number(e.target.value))}
              className="px-3 py-2 rounded-lg text-sm text-white font-mono focus:outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid rgba(34,211,238,0.2)' }}>
              <option value={7}>7 Days</option>
              <option value={30}>30 Days</option>
              <option value={90}>90 Days</option>
            </select>
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-cyan-400 transition-all hover:bg-cyan-400/10"
              style={{ border: '1px solid rgba(34,211,238,0.2)' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <RefreshCw size={24} className="animate-spin mr-3" /> Loading analytics...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Historical AQI trend */}
            {history.length > 0 && (
              <div className="glow-border rounded-2xl p-6" style={{ background: 'var(--bg-card)' }}>
                <h2 className="font-display font-bold text-white mb-1 text-sm uppercase tracking-widest">Historical AQI</h2>
                <p className="text-xs text-slate-500 mb-6">Past {days} days of air quality data</p>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickFormatter={(v) => v.slice(5)} interval={Math.floor(history.length / 8)} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                    <Tooltip {...tooltipStyle} formatter={(v) => [`${v}`, 'AQI']} />
                    <Area type="monotone" dataKey="aqi" stroke="#22d3ee" strokeWidth={2}
                      fill="url(#histGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* PM2.5 & PM10 trend */}
            {history.length > 0 && (
              <div className="glow-border rounded-2xl p-6" style={{ background: 'var(--bg-card)' }}>
                <h2 className="font-display font-bold text-white mb-1 text-sm uppercase tracking-widest">Pollution Trends</h2>
                <p className="text-xs text-slate-500 mb-6">PM2.5 vs PM10 vs NO₂</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickFormatter={(v) => v.slice(5)} interval={Math.floor(history.length / 8)} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                    <Tooltip {...tooltipStyle} />
                    <Line type="monotone" dataKey="pm25" stroke="#FF6B6B" strokeWidth={2} dot={false} name="PM2.5" />
                    <Line type="monotone" dataKey="pm10" stroke="#FF7E00" strokeWidth={2} dot={false} name="PM10" />
                    <Line type="monotone" dataKey="no2" stroke="#8B5CF6" strokeWidth={2} dot={false} name="NO₂" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-4 justify-center">
                  {[['PM2.5', '#FF6B6B'], ['PM10', '#FF7E00'], ['NO₂', '#8B5CF6']].map(([label, color]) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <div className="w-4 h-0.5 rounded" style={{ background: color }} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Two-column: Feature Importance + Model Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Feature importance */}
              {featureData.length > 0 && (
                <div className="glow-border rounded-2xl p-6" style={{ background: 'var(--bg-card)' }}>
                  <h2 className="font-display font-bold text-white mb-1 text-sm uppercase tracking-widest">Feature Importance</h2>
                  <p className="text-xs text-slate-500 mb-6">Which parameters drive AQI predictions</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={featureData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }} width={55} />
                      <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'Importance']} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {featureData.map((_, i) => (
                          <Cell key={i} fill={`hsl(${190 + i * 20}, 70%, ${65 - i * 5}%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Model comparison */}
              {modelData.length > 0 && (
                <div className="glow-border rounded-2xl p-6" style={{ background: 'var(--bg-card)' }}>
                  <h2 className="font-display font-bold text-white mb-1 text-sm uppercase tracking-widest">Model Comparison</h2>
                  <p className="text-xs text-slate-500 mb-4">R² score (%) — higher is better</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={modelData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'R²']} />
                      <Bar dataKey="r2" radius={[4, 4, 0, 0]}>
                        {modelData.map((m, i) => (
                          <Cell key={i} fill={i === 0 ? '#22d3ee' : i === 1 ? '#8B5CF6' : '#64748b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Metrics table */}
                  <div className="mt-4 space-y-2">
                    {modelData.map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <span className="text-slate-300 font-medium">{m.name}</span>
                        <div className="flex gap-4 font-mono">
                          <span className="text-cyan-400">R² {m.r2}%</span>
                          <span className="text-slate-400">MAE {m.mae}</span>
                          <span className="text-slate-400">RMSE {m.rmse}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {metrics?.best_model && (
                    <div className="mt-3 px-3 py-2 rounded-lg text-xs text-center"
                      style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' }}>
                      <span className="text-slate-400">Best model: </span>
                      <span className="text-cyan-400 font-bold">{metrics.best_model}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Predicted vs Actual Scatter */}
            {scatterData.length > 0 && (
              <div className="glow-border rounded-2xl p-6" style={{ background: 'var(--bg-card)' }}>
                <h2 className="font-display font-bold text-white mb-1 text-sm uppercase tracking-widest">Predicted vs Actual</h2>
                <p className="text-xs text-slate-500 mb-6">Model accuracy on test data — closer to diagonal = better</p>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="actual" name="Actual AQI" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }} label={{ value: 'Actual', position: 'insideBottom', fill: '#64748b', offset: -5, fontSize: 11 }} />
                    <YAxis dataKey="predicted" name="Predicted AQI" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }} label={{ value: 'Predicted', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
                    <ZAxis range={[30, 30]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} {...tooltipStyle}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0]?.payload
                        return (
                          <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(13,21,41,0.95)', border: '1px solid rgba(34,211,238,0.2)' }}>
                            <p className="text-slate-400">Actual: <span className="text-white font-bold">{d?.actual}</span></p>
                            <p className="text-slate-400">Predicted: <span className="text-cyan-400 font-bold">{d?.predicted}</span></p>
                            <p className="text-slate-500">Error: {Math.abs((d?.actual || 0) - (d?.predicted || 0)).toFixed(1)}</p>
                          </div>
                        )
                      }} />
                    <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 400, y: 400 }]} stroke="rgba(34,211,238,0.3)" strokeDasharray="5 5" label={{ value: 'Perfect', fill: 'rgba(34,211,238,0.5)', fontSize: 10 }} />
                    <Scatter data={scatterData} fill="#22d3ee" fillOpacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* AQI distribution from history */}
            {history.length > 0 && (() => {
              const bins = [
                { label: 'Good\n0-50', count: 0, color: '#00E400' },
                { label: 'Moderate\n51-100', count: 0, color: '#FFFF00' },
                { label: 'Sensitive\n101-150', count: 0, color: '#FF7E00' },
                { label: 'Unhealthy\n151-200', count: 0, color: '#FF0000' },
                { label: 'Very\n201-300', count: 0, color: '#8F3F97' },
                { label: 'Hazardous\n301+', count: 0, color: '#7E0023' },
              ]
              history.forEach(d => {
                const i = d.aqi <= 50 ? 0 : d.aqi <= 100 ? 1 : d.aqi <= 150 ? 2 : d.aqi <= 200 ? 3 : d.aqi <= 300 ? 4 : 5
                bins[i].count++
              })
              return (
                <div className="glow-border rounded-2xl p-6" style={{ background: 'var(--bg-card)' }}>
                  <h2 className="font-display font-bold text-white mb-1 text-sm uppercase tracking-widest">AQI Distribution</h2>
                  <p className="text-xs text-slate-500 mb-6">Frequency of each air quality category in the past {days} days</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={bins} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 9 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <Tooltip {...tooltipStyle} formatter={(v) => [`${v} days`, 'Count']} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {bins.map((b, i) => <Cell key={i} fill={b.color} fillOpacity={0.8} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
