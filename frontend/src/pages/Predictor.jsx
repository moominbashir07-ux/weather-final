import { useState, useEffect, useRef } from 'react'
import { Activity, AlertCircle, RefreshCw, Zap } from 'lucide-react'
import ParamInput from '../components/ParamInput'
import AQIGauge from '../components/AQIGauge'
import StatCard from '../components/StatCard'
import { predictAQI } from '../utils/api'
import { DEFAULT_FORM, PARAM_LABELS, classifyAQI } from '../utils/aqi'
import clsx from 'clsx'

const HEALTH_TIPS = {
  Good: ['✅ Ideal for outdoor activities', '🌿 Great day for jogging or cycling', '🪟 Open windows for fresh air'],
  Moderate: ['⚠️ Consider reducing prolonged outdoor exertion', '😷 Sensitive individuals should monitor health', '🏠 Air purifiers optional indoors'],
  'Unhealthy for Sensitive Groups': ['👨‍⚕️ People with respiratory issues should limit time outside', '😷 Wear N95 mask outdoors', '🏥 Check with doctor if symptoms arise'],
  Unhealthy: ['🚫 Avoid prolonged outdoor activity for everyone', '😷 N95 mask mandatory outdoors', '🏠 Keep windows closed'],
  'Very Unhealthy': ['🚨 Health alert — minimize all outdoor exposure', '😷 Full respiratory protection required', '🏥 Have emergency contacts ready'],
  Hazardous: ['⛔ Do NOT go outside unless absolutely necessary', '🆘 Emergency health conditions possible', '📞 Contact health services if experiencing symptoms'],
}

export default function Predictor() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [locationName, setLocationName] = useState('')
  const [locationError, setLocationError] = useState(null)

  const fetchAbortRef = useRef(null)
  const searchAbortRef = useRef(null)
  const autoDetectAbortRef = useRef(null)

  // Cleanup abort controllers on unmount
  useEffect(() => {
    return () => {
      if (fetchAbortRef.current) fetchAbortRef.current.abort()
      if (searchAbortRef.current) searchAbortRef.current.abort()
      if (autoDetectAbortRef.current) autoDetectAbortRef.current.abort()
    }
  }, [])

  const fetchLocationData = async (lat, lon, label) => {
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort()
    }
    const controller = new AbortController()
    fetchAbortRef.current = controller
    const signal = controller.signal

    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 10000)

    setSearchLoading(true)
    setLocationError(null)
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`
      const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide`

      // Parallel fetching via Promise.all
      const [weatherRes, aqRes] = await Promise.all([
        fetch(weatherUrl, { signal }).then(res => {
          if (!res.ok) throw new Error("Weather coordinates lookups failed.")
          return res.json()
        }),
        fetch(aqUrl, { signal }).then(res => {
          if (!res.ok) throw new Error("Air quality limits lookup failed.")
          return res.json()
        })
      ])

      const weatherCurrent = weatherRes?.current
      const aqCurrent = aqRes?.current

      if (!weatherCurrent || !aqCurrent) {
        throw new Error("Unable to retrieve environmental coordinates from live sensor grid.")
      }

      const pm25 = parseFloat(aqCurrent.pm2_5 || 0)
      const temp = parseFloat(weatherCurrent.temperature_2m || 25)
      const hum = parseFloat(weatherCurrent.relative_humidity_2m || 60)
      const wind = parseFloat(weatherCurrent.wind_speed_10m || 10)
      const pm10 = parseFloat(aqCurrent.pm10 || 0)
      const no2 = parseFloat(aqCurrent.nitrogen_dioxide || 0)
      const so2 = parseFloat(aqCurrent.sulphur_dioxide || 0)
      const co2 = Math.min(2000, Math.max(400, Math.round(410 + pm25 * 3)))

      const newForm = {
        temperature: parseFloat(temp.toFixed(1)),
        humidity: Math.round(hum),
        wind_speed: parseFloat(wind.toFixed(1)),
        co2,
        pm25: parseFloat(pm25.toFixed(1)),
        pm10: parseFloat(pm10.toFixed(1)),
        no2: parseFloat(no2.toFixed(1)),
        so2: parseFloat(so2.toFixed(1))
      }

      setForm(newForm)
      setLocationName(label)

      setLoading(true)
      setError(null)
      try {
        const predictRes = await predictAQI(newForm)
        setResult(predictRes)
      } catch (predictErr) {
        setError(predictErr.message)
      } finally {
        setLoading(false)
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setLocationError(err.message)
      }
    } finally {
      clearTimeout(timeoutId)
      setSearchLoading(false)
    }
  }

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return

    if (searchAbortRef.current) {
      searchAbortRef.current.abort()
    }
    const controller = new AbortController()
    searchAbortRef.current = controller
    const signal = controller.signal

    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 10000)

    setSearchLoading(true)
    setLocationError(null)
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=en&format=json`
      const geoRes = await fetch(geoUrl, { signal }).then(res => {
        if (!res.ok) throw new Error("Location resolution request failed.")
        return res.json()
      })
      const resultCity = geoRes?.results?.[0]
      if (!resultCity) {
        throw new Error(`Location '${searchQuery}' not found. Please try another city.`)
      }
      const label = `${resultCity.name}, ${resultCity.country || ''}`
      await fetchLocationData(resultCity.latitude, resultCity.longitude, label)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setLocationError(err.message)
        setSearchLoading(false)
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Browser geolocation is not supported by your device.")
      return
    }

    if (autoDetectAbortRef.current) {
      autoDetectAbortRef.current.abort()
    }
    const controller = new AbortController()
    autoDetectAbortRef.current = controller
    const signal = controller.signal

    setSearchLoading(true)
    setLocationError(null)

    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 10000)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        let label = `My Location (Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)})`

        try {
          const revGeoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          const revRes = await fetch(revGeoUrl, { 
            headers: { 'User-Agent': 'AQI-Predictor' },
            signal
          }).then(res => {
            if (!res.ok) throw new Error()
            return res.json()
          })
          if (revRes && revRes.display_name) {
            const city = revRes.address.city || revRes.address.town || revRes.address.village || revRes.address.suburb
            label = city ? `${city}, ${revRes.address.country || ''}` : revRes.display_name
          }
        } catch (e) {
          console.warn('[Reverse Geocode Failed] falling back to default name coordinates')
        } finally {
          clearTimeout(timeoutId)
        }
        await fetchLocationData(lat, lon, label)
      },
      (err) => {
        clearTimeout(timeoutId)
        setLocationError("Location access denied or timed out.")
        setSearchLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  useEffect(() => {
    handleAutoDetectLocation()
  }, [])

  const handleChange = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handlePreset = (preset) => {
    const presets = {
      clean: { temperature: 22, humidity: 45, wind_speed: 15, co2: 400, pm25: 8, pm10: 15, no2: 15, so2: 5 },
      moderate: { temperature: 28, humidity: 65, wind_speed: 8, co2: 550, pm25: 45, pm10: 90, no2: 55, so2: 30 },
      polluted: { temperature: 35, humidity: 80, wind_speed: 3, co2: 900, pm25: 150, pm10: 300, no2: 120, so2: 90 },
    }
    setForm(presets[preset])
    setResult(null)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await predictAQI(form)
      setResult(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const cat = result ? classifyAQI(result.aqi) : null
  const tips = result ? (HEALTH_TIPS[result.category] || HEALTH_TIPS.Good) : []

  return (
    <div className="min-h-screen pt-24 px-6 pb-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-cyan-400" size={22} />
            <h1 className="font-display text-3xl font-bold text-white">AQI Predictor</h1>
          </div>
          <p className="text-slate-400 text-sm">Enter environmental parameters to get an instant AQI prediction.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Form panel */}
          <div>
            {/* Live Location Fetcher */}
            <div className="glow-border rounded-2xl p-6 mb-6 backdrop-blur-md bg-black/40" style={{ background: 'var(--bg-card)' }}>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span>📍</span> Live Location Fetcher
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Enter city name (e.g. New Delhi, London)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 font-sans"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                  />
                  {searchLoading && (
                    <span className="absolute right-3 top-3 text-xs text-cyan-400 animate-pulse font-mono">Loading...</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSearchLocation}
                    disabled={searchLoading}
                    className="px-4 py-2.5 bg-cyan-400 hover:bg-cyan-500 text-black font-semibold rounded-xl text-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    Search
                  </button>
                  <button
                    onClick={handleAutoDetectLocation}
                    disabled={searchLoading}
                    className="px-4 py-2.5 border border-cyan-400/30 hover:border-cyan-400 text-cyan-400 font-semibold rounded-xl text-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>🎯</span> Detect Me
                  </button>
                </div>
              </div>
              {locationName && (
                <p className="text-xs text-green-400 mt-2 font-mono">
                  ✓ Loaded live parameters for: <strong className="text-white">{locationName}</strong>
                </p>
              )}
              {locationError && (
                <p className="text-xs text-red-400 mt-2 font-mono">
                  ⚠ {locationError}
                </p>
              )}
            </div>

            {/* Presets */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs text-slate-400">Quick presets:</span>
              {['clean', 'moderate', 'polluted'].map((p) => (
                <button key={p} onClick={() => handlePreset(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all hover:scale-105"
                  style={{
                    background: p === 'clean' ? 'rgba(0,228,0,0.1)' : p === 'moderate' ? 'rgba(255,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                    border: `1px solid ${p === 'clean' ? 'rgba(0,228,0,0.3)' : p === 'moderate' ? 'rgba(255,255,0,0.3)' : 'rgba(255,0,0,0.3)'}`,
                    color: p === 'clean' ? '#00E400' : p === 'moderate' ? '#FFFF00' : '#FF6B6B',
                  }}>
                  {p}
                </button>
              ))}
              <button onClick={() => { setForm(DEFAULT_FORM); setResult(null) }}
                className="ml-auto text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs">
                <RefreshCw size={12} /> Reset
              </button>
            </div>

            {/* Input grid */}
            <div className="grid md:grid-cols-2 gap-6 p-6 rounded-2xl glow-border" style={{ background: 'var(--bg-card)' }}>
              {Object.keys(PARAM_LABELS).map((key) => (
                <ParamInput key={key} name={key} value={form[key]} onChange={handleChange} />
              ))}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={clsx(
                'w-full mt-6 py-4 rounded-xl font-display font-bold text-black text-lg flex items-center justify-center gap-3 transition-all',
                loading ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02] hover:shadow-lg',
              )}
              style={{ background: loading ? 'rgba(34,211,238,0.5)' : 'linear-gradient(135deg, #22d3ee, #0891b2)', boxShadow: '0 0 30px rgba(34,211,238,0.2)' }}>
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Zap size={18} /> Predict AQI
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-400"
                style={{ background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.2)' }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>

          {/* Result panel */}
          <div className="space-y-4">
            {/* Gauge */}
            <div className="rounded-2xl glow-border p-6 flex flex-col items-center" style={{ background: 'var(--bg-card)' }}>
              {result ? (
                <>
                  <AQIGauge aqi={result.aqi} size={220} />
                  <div className="mt-4 text-center">
                    <div className="text-xs font-mono text-slate-400">
                      Predicted by <span className="text-cyan-400">{result.model_used}</span>
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-1">Confidence: {result.confidence}</div>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed mx-auto mb-4 flex items-center justify-center"
                    style={{ borderColor: 'rgba(34,211,238,0.2)' }}>
                    <Activity size={24} className="text-slate-500" />
                  </div>
                  <p className="text-slate-500 text-sm">Enter parameters and click<br />Predict AQI</p>
                </div>
              )}
            </div>

            {/* Health tips */}
            {result && (
              <div className="rounded-2xl glow-border p-5" style={{ background: 'var(--bg-card)', borderColor: `${cat.color}30` }}>
                <h3 className="font-display font-bold text-sm text-white mb-3">Health Advisory</h3>
                <div className="space-y-2">
                  {tips.map((tip, i) => (
                    <p key={i} className="text-xs text-slate-300 py-1.5 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {tip}
                    </p>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3 italic leading-relaxed">{result.health_message}</p>
              </div>
            )}

            {/* Stats grid */}
            {result && (
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="PM2.5 Input" value={form.pm25} unit="µg/m³" icon="🔴" />
                <StatCard label="PM10 Input" value={form.pm10} unit="µg/m³" icon="🟠" />
                <StatCard label="NO₂ Input" value={form.no2} unit="µg/m³" icon="⚗️" />
                <StatCard label="Wind Speed" value={form.wind_speed} unit="km/h" icon="💨" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
