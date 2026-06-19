import { useState, useEffect, useRef } from 'react'
import { Settings, RefreshCw, CheckCircle, AlertCircle, Cpu, Activity } from 'lucide-react'
import { trainModel, getHealth, getMetrics } from '../utils/api'

export default function Admin() {
  const [health, setHealth] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [training, setTraining] = useState(false)
  const [trainResult, setTrainResult] = useState(null)
  const [trainError, setTrainError] = useState(null)
  const [logs, setLogs] = useState([])
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => { isMountedRef.current = false }
  }, [])

  const addLog = (msg, type = 'info') => {
    if (!isMountedRef.current) return
    setLogs(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }])
  }

  const loadStatus = async () => {
    try {
      const [h, m] = await Promise.allSettled([getHealth(), getMetrics()])
      if (!isMountedRef.current) return
      if (h.status === 'fulfilled') setHealth(h.value)
      if (m.status === 'fulfilled') setMetrics(m.value)
    } catch {}
  }

  useEffect(() => { loadStatus() }, [])

  const handleTrain = async () => {
    setTraining(true)
    setTrainResult(null)
    setTrainError(null)
    addLog('Starting model training pipeline...', 'info')
    addLog('Loading synthetic dataset (2000 samples)...', 'info')
    try {
      const res = await trainModel()
      if (!isMountedRef.current) return
      addLog(`Training complete! Best model: ${res.best_model}`, 'success')
      Object.entries(res.metrics).forEach(([name, m]) => {
        addLog(`  ${name}: R²=${(m.r2 * 100).toFixed(1)}% MAE=${m.mae.toFixed(1)} RMSE=${m.rmse.toFixed(1)}`, 'metric')
      })
      addLog('Model artifacts saved to disk.', 'success')
      setTrainResult(res)
      await loadStatus()
    } catch (e) {
      if (!isMountedRef.current) return
      addLog(`Training failed: ${e.message}`, 'error')
      setTrainError(e.message)
    } finally {
      if (isMountedRef.current) setTraining(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 px-6 pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings className="text-cyan-400" size={22} />
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400 text-sm">Model management and system diagnostics</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* System Status */}
          <div className="glow-border rounded-2xl p-6" style={{ background: 'var(--bg-card)' }}>
            <h2 className="font-display font-bold text-white mb-4 text-sm uppercase tracking-widest">System Status</h2>
            <div className="space-y-3">
              {[
                { label: 'API Status', value: health ? 'Online' : 'Offline', ok: !!health },
                { label: 'Model Loaded', value: health?.model_loaded ? 'Yes' : 'No', ok: health?.model_loaded },
                { label: 'Active Model', value: health?.model || metrics?.best_model || '—', ok: true },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between py-2 px-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-sm text-slate-400">{s.label}</span>
                  <div className="flex items-center gap-2">
                    {s.ok ? <CheckCircle size={13} className="text-green-400" /> : <AlertCircle size={13} className="text-red-400" />}
                    <span className={`text-sm font-mono font-medium ${s.ok ? 'text-green-400' : 'text-red-400'}`}>{s.value}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={loadStatus}
              className="w-full mt-4 py-2 rounded-lg text-xs text-slate-400 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <RefreshCw size={12} /> Refresh Status
            </button>
          </div>

          {/* Model Metrics */}
          <div className="glow-border rounded-2xl p-6" style={{ background: 'var(--bg-card)' }}>
            <h2 className="font-display font-bold text-white mb-4 text-sm uppercase tracking-widest">Model Metrics</h2>
            {metrics?.all_models ? (
              <div className="space-y-3">
                {metrics.all_models.map((m, i) => (
                  <div key={i} className="py-2 px-3 rounded-lg" style={{
                    background: m.name === metrics.best_model ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.03)',
                    border: m.name === metrics.best_model ? '1px solid rgba(34,211,238,0.2)' : '1px solid transparent',
                  }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-white">{m.name}</span>
                      {m.name === metrics.best_model && (
                        <span className="text-xs px-2 py-0.5 rounded-full text-cyan-400"
                          style={{ background: 'rgba(34,211,238,0.1)' }}>Best</span>
                      )}
                    </div>
                    <div className="flex gap-4 font-mono text-xs">
                      <span className="text-cyan-400">R² {(m.r2 * 100).toFixed(1)}%</span>
                      <span className="text-slate-400">MAE {m.mae.toFixed(1)}</span>
                      <span className="text-slate-400">RMSE {m.rmse.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No metrics yet. Train a model first.</p>
            )}
          </div>
        </div>

        {/* Retrain section */}
        <div className="mt-6 glow-border rounded-2xl p-6" style={{ background: 'var(--bg-card)' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-white text-sm uppercase tracking-widest mb-1">Retrain Model</h2>
              <p className="text-xs text-slate-400">
                Trains Linear Regression, Random Forest, and Decision Tree. Automatically selects the best model.
              </p>
            </div>
            <Cpu size={20} className="text-cyan-400 mt-1" />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
            {['Linear Regression', 'Random Forest', 'Decision Tree'].map((m) => (
              <div key={m} className="px-3 py-2 rounded-lg text-center text-slate-400" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {m}
              </div>
            ))}
          </div>

          <button
            onClick={handleTrain}
            disabled={training}
            className="w-full py-3.5 rounded-xl font-display font-bold text-black transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
            style={{ background: training ? 'rgba(34,211,238,0.5)' : 'linear-gradient(135deg, #22d3ee, #0891b2)' }}>
            {training ? (
              <><RefreshCw size={16} className="animate-spin" /> Training in progress...</>
            ) : (
              <><Activity size={16} /> Retrain All Models</>
            )}
          </button>

          {trainResult && (
            <div className="mt-4 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(0,228,0,0.08)', border: '1px solid rgba(0,228,0,0.2)' }}>
              <div className="flex items-center gap-2 text-green-400 font-medium">
                <CheckCircle size={14} />
                Training complete! Best model: <strong>{trainResult.best_model}</strong>
              </div>
            </div>
          )}

          {trainError && (
            <div className="mt-4 px-4 py-3 rounded-xl text-sm text-red-400"
              style={{ background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.2)' }}>
              <AlertCircle size={14} className="inline mr-2" />{trainError}
            </div>
          )}
        </div>

        {/* Console log */}
        {logs.length > 0 && (
          <div className="mt-6 glow-border rounded-2xl p-6" style={{ background: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-white text-sm uppercase tracking-widest">Training Log</h2>
              <button onClick={() => setLogs([])} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                Clear
              </button>
            </div>
            <div className="font-mono text-xs space-y-1 max-h-48 overflow-y-auto pr-2">
              {logs.map((l, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-slate-600">{l.ts}</span>
                  <span className={
                    l.type === 'success' ? 'text-green-400' :
                    l.type === 'error' ? 'text-red-400' :
                    l.type === 'metric' ? 'text-cyan-400' : 'text-slate-300'
                  }>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature importance */}
        {metrics?.feature_importance && (
          <div className="mt-6 glow-border rounded-2xl p-6" style={{ background: 'var(--bg-card)' }}>
            <h2 className="font-display font-bold text-white mb-4 text-sm uppercase tracking-widest">Feature Importance</h2>
            <div className="space-y-2">
              {Object.entries(metrics.feature_importance)
                .sort(([, a], [, b]) => b - a)
                .map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-400 w-20 text-right">{k.toUpperCase()}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/5">
                      <div className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${(v * 100).toFixed(1)}%`, background: 'linear-gradient(90deg, #22d3ee, #0891b2)' }} />
                    </div>
                    <span className="font-mono text-xs text-cyan-400 w-10">{(v * 100).toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
