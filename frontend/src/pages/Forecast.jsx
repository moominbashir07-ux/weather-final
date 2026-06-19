import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  TrendingUp, RefreshCw, AlertCircle, Calendar, Search, MapPin, 
  Wind, Droplets, Eye, Thermometer, Compass, Sun, CloudRain, 
  ShieldAlert, Sparkles, HeartPulse, Play, Pause, ChevronRight, Activity,
  Cloud, CloudSun, CloudDrizzle, CloudSnow, CloudLightning, CloudFog,
  Download, History, Trash2
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend
} from 'recharts'
import AQIGauge from '../components/AQIGauge'
import { classifyAQI } from '../utils/aqi'
import clsx from 'clsx'

const HEALTH_ADVISORY = {
  'Good': {
    status: 'Good',
    description: 'Air quality is satisfactory, and air pollution poses little or no risk.',
    advice: [
      'Perfect day for outdoor exercise, jogging, or cycling.',
      'Open windows to ventilate indoor spaces with fresh air.',
      'Outdoor activities are highly encouraged.'
    ],
    color: '#00E400',
    bg: 'rgba(0, 228, 0, 0.08)',
  },
  'Moderate': {
    status: 'Moderate',
    description: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.',
    advice: [
      'Unusually sensitive people should consider reducing prolonged or heavy exertion outdoors.',
      'Watch for symptoms like coughing or throat irritation.',
      'Ventilation is generally fine, but monitor updates if sensitive.'
    ],
    color: '#FFFF00',
    bg: 'rgba(255, 255, 0, 0.08)',
  },
  'Unhealthy for Sensitive Groups': {
    status: 'Sensitive Warning',
    description: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.',
    advice: [
      'People with asthma or respiratory issues should limit time outside.',
      'Active children and adults should avoid heavy outdoor exertion.',
      'Consider keeping windows closed and running an air purifier.'
    ],
    color: '#FF7E00',
    bg: 'rgba(255, 126, 0, 0.08)',
  },
  'Unhealthy': {
    status: 'Unhealthy',
    description: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.',
    advice: [
      'Avoid prolonged or heavy outdoor activity.',
      'Wear an N95 mask if you must spend extended time outdoors.',
      'Keep windows closed and run indoor air purifiers.'
    ],
    color: '#FF0000',
    bg: 'rgba(255, 0, 0, 0.08)',
  },
  'Very Unhealthy': {
    status: 'Very Unhealthy',
    description: 'Health alert: The risk of health effects is increased for everyone.',
    advice: [
      'Strictly limit all outdoor physical activities.',
      'N95 respiratory masks are mandatory for any outdoor exposure.',
      'Recirculate indoor air and ensure air filtration is running.'
    ],
    color: '#8F3F97',
    bg: 'rgba(143, 63, 151, 0.08)',
  },
  'Hazardous': {
    status: 'Hazardous',
    description: 'Health warning of emergency conditions: everyone is more likely to be affected.',
    advice: [
      'Remain indoors. Avoid all physical activity outdoors.',
      'Keep all doors and windows sealed completely.',
      'Contact emergency health services if chest pain or breathing issues arise.'
    ],
    color: '#7E0023',
    bg: 'rgba(126, 0, 35, 0.08)',
  }
}

const getWindDirectionLabel = (deg) => {
  if (deg === undefined || deg === null) return '-'
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const val = Math.floor((deg / 22.5) + 0.5)
  return directions[val % 16]
}

// Map weather codes to icons and descriptions
const getWeatherDetails = (code) => {
  const codes = {
    0: { label: 'Clear Sky', icon: Sun, color: 'text-amber-400' },
    1: { label: 'Mainly Clear', icon: CloudSun, color: 'text-amber-200' },
    2: { label: 'Partly Cloudy', icon: CloudSun, color: 'text-sky-300' },
    3: { label: 'Overcast', icon: Cloud, color: 'text-slate-400' },
    45: { label: 'Foggy', icon: CloudFog, color: 'text-slate-500' },
    48: { label: 'Depositing Rime Fog', icon: CloudFog, color: 'text-slate-400' },
    51: { label: 'Light Drizzle', icon: CloudDrizzle, color: 'text-blue-300' },
    53: { label: 'Moderate Drizzle', icon: CloudDrizzle, color: 'text-blue-400' },
    55: { label: 'Dense Drizzle', icon: CloudDrizzle, color: 'text-blue-500' },
    56: { label: 'Light Freezing Drizzle', icon: CloudSnow, color: 'text-sky-200' },
    57: { label: 'Dense Freezing Drizzle', icon: CloudSnow, color: 'text-sky-400' },
    61: { label: 'Slight Rain', icon: CloudRain, color: 'text-blue-300' },
    63: { label: 'Moderate Rain', icon: CloudRain, color: 'text-blue-500' },
    65: { label: 'Heavy Rain', icon: CloudRain, color: 'text-blue-700' },
    66: { label: 'Light Freezing Rain', icon: CloudSnow, color: 'text-sky-300' },
    67: { label: 'Heavy Freezing Rain', icon: CloudSnow, color: 'text-sky-500' },
    71: { label: 'Slight Snow Fall', icon: CloudSnow, color: 'text-slate-200' },
    73: { label: 'Moderate Snow Fall', icon: CloudSnow, color: 'text-slate-100' },
    75: { label: 'Heavy Snow Fall', icon: CloudSnow, color: 'text-white' },
    77: { label: 'Snow Grains', icon: CloudSnow, color: 'text-slate-300' },
    80: { label: 'Slight Rain Showers', icon: CloudRain, color: 'text-blue-400' },
    81: { label: 'Moderate Rain Showers', icon: CloudRain, color: 'text-blue-500' },
    82: { label: 'Violent Rain Showers', icon: CloudRain, color: 'text-blue-600' },
    85: { label: 'Slight Snow Showers', icon: CloudSnow, color: 'text-slate-200' },
    86: { label: 'Heavy Snow Showers', icon: CloudSnow, color: 'text-slate-100' },
    95: { label: 'Thunderstorm', icon: CloudLightning, color: 'text-yellow-400' },
    96: { label: 'Thunderstorm with Slight Hail', icon: CloudLightning, color: 'text-amber-500' },
    99: { label: 'Thunderstorm with Heavy Hail', icon: CloudLightning, color: 'text-red-500' },
  }
  return codes[code] || { label: 'Moderate Weather', icon: CloudSun, color: 'text-slate-300' }
}

// PM2.5 AQI Formula
const getAqiFromPM25 = (pm25) => {
  if (pm25 <= 12.0) return Math.round((50 / 12.0) * pm25)
  if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51)
  if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101)
  if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151)
  if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201)
  if (pm25 <= 350.4) return Math.round(((400 - 301) / (350.4 - 250.5)) * (pm25 - 250.5) + 301)
  return Math.round(((500 - 401) / (500.4 - 350.5)) * (pm25 - 350.5) + 401)
}

// PM10 AQI Formula
const getAqiFromPM10 = (pm10) => {
  if (pm10 <= 54) return Math.round((50 / 54) * pm10)
  if (pm10 <= 154) return Math.round(((100 - 51) / (154 - 55)) * (pm10 - 55) + 51)
  if (pm10 <= 254) return Math.round(((150 - 101) / (254 - 155)) * (pm10 - 155) + 101)
  if (pm10 <= 354) return Math.round(((200 - 151) / (354 - 255)) * (pm10 - 255) + 151)
  if (pm10 <= 424) return Math.round(((300 - 201) / (424 - 355)) * (pm10 - 355) + 201)
  if (pm10 <= 504) return Math.round(((400 - 301) / (504 - 425)) * (pm10 - 425) + 301)
  return Math.round(((500 - 401) / (604 - 505)) * (pm10 - 505) + 401)
}

export default function Forecast() {
  const [coords, setCoords] = useState({ lat: 28.6139, lon: 77.2090 })
  const [locationName, setLocationName] = useState('New Delhi, India')
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  // LocalStorage recent searches
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('recent_searches')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })
  
  // Weather & AQI telemetry data
  const [weatherData, setWeatherData] = useState(null)
  const [aqData, setAqData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false)
  const [error, setError] = useState(null)
  
  // Polling variables
  const [countdown, setCountdown] = useState(30)
  const [pollingActive, setPollingActive] = useState(true)
  const [tabActive, setTabActive] = useState(true)

  // Chart and Subgrid Tab selection
  const [chartTab, setChartTab] = useState('weather')
  const [telemetryTab, setTelemetryTab] = useState('weather')

  // Refs
  const searchRef = useRef(null)
  const abortControllerRef = useRef(null)
  const isFetchingRef = useRef(false)
  const requestIdRef = useRef(0)
  const suggestionAbortRef = useRef(null)
  const geoDetectAbortRef = useRef(null)

  // Tab visibility changes observer to pause/resume polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      const active = document.visibilityState === 'visible'
      setTabActive(active)
      if (active) {
        setCountdown(30)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Cleanup abort controllers on component unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort()
      if (suggestionAbortRef.current) suggestionAbortRef.current.abort()
      if (geoDetectAbortRef.current) geoDetectAbortRef.current.abort()
    }
  }, [])

  // Add location to recent list (limit 5)
  const addToRecent = useCallback((loc) => {
    if (!loc) return
    const newItem = {
      name: loc.name,
      country: loc.country,
      admin1: loc.admin1,
      latitude: loc.latitude,
      longitude: loc.longitude
    }
    setRecentSearches(prev => {
      const filtered = (Array.isArray(prev) ? prev : []).filter(item => 
        item && !(item.latitude === newItem.latitude && item.longitude === newItem.longitude)
      )
      const nextList = [newItem, ...filtered].slice(0, 5)
      localStorage.setItem('recent_searches', JSON.stringify(nextList))
      return nextList
    })
  }, [])

  // Clear recent searches
  const handleClearRecent = () => {
    localStorage.removeItem('recent_searches')
    setRecentSearches([])
  }

  // Fetch telemetry function
  const fetchTelemetry = useCallback(async (latitude, longitude, showMainLoader = false) => {
    const curRequestId = ++requestIdRef.current

    // Prevent overlapping API requests by aborting previous fetch controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller
    const signal = controller.signal

    // Enforce 10-second timeout
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 10000)

    isFetchingRef.current = true
    if (showMainLoader) {
      setLoading(true)
    } else {
      setBackgroundRefreshing(true)
    }
    setError(null)
    
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m,wind_direction_10m,visibility,temperature_80m,weather_code&hourly=temperature_2m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,rain_sum,showers_sum,wind_speed_10m_max,weather_code&timezone=auto`
      const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm2_5,pm10,ozone,nitrogen_dioxide,carbon_monoxide,dust,uv_index,us_aqi&hourly=pm2_5,pm10,ozone,nitrogen_dioxide,carbon_monoxide,dust,uv_index,us_aqi&timezone=auto`

      // 1. Fetch weather and air quality in parallel using Promise.all
      const [weatherRes, aqRes] = await Promise.all([
        fetch(weatherUrl, { signal }).then(r => {
          if (!r.ok) throw new Error('Failed to fetch weather telemetry.')
          return r.json()
        }),
        fetch(aqUrl, { signal }).then(r => {
          if (!r.ok) throw new Error('Failed to fetch air quality telemetry.')
          return r.json()
        })
      ])

      // 2. Validate structures to prevent runtime client crashes
      if (!weatherRes || !weatherRes.current || !weatherRes.hourly || !weatherRes.daily) {
        throw new Error('Malformed weather telemetry payload structure.')
      }
      if (!aqRes || !aqRes.current || !aqRes.hourly) {
        throw new Error('Malformed air quality telemetry payload structure.')
      }
      
      if (curRequestId === requestIdRef.current) {
        setWeatherData(weatherRes)
        setAqData(aqRes)
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return // Ignore aborts
      }
      console.error('[Telemetry Fetch Error]', err)
      if (curRequestId === requestIdRef.current) {
        setError(err.message || 'An error occurred while loading environmental dashboard telemetry.')
      }
    } finally {
      clearTimeout(timeoutId)
      if (curRequestId === requestIdRef.current) {
        isFetchingRef.current = false
        setLoading(false)
        setBackgroundRefreshing(false)
      }
    }
  }, [])

  // Initial load + background polling scheduler
  useEffect(() => {
    fetchTelemetry(coords.lat, coords.lon, true)
    setCountdown(30)
  }, [coords, fetchTelemetry])

  // Count timer effect (30 seconds polling)
  useEffect(() => {
    if (!pollingActive || !tabActive) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (!isFetchingRef.current) {
            fetchTelemetry(coords.lat, coords.lon, false)
          }
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [pollingActive, tabActive, coords, fetchTelemetry])

  // Click outside suggestions list close hook
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Geocoding query debouncing - changed to 500ms + AbortController
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([])
      return
    }

    if (suggestionAbortRef.current) {
      suggestionAbortRef.current.abort()
    }
    const controller = new AbortController()
    suggestionAbortRef.current = controller
    const signal = controller.signal

    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 10000)

    const fetchSuggestions = async () => {
      setSearchLoading(true)
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=10&language=en&format=json`
        const res = await fetch(url, { signal }).then(r => {
          if (!r.ok) throw new Error('Failed to resolve suggestions lookup.')
          return r.json()
        })
        if (res && Array.isArray(res.results)) {
          setSuggestions(res.results)
        } else {
          setSuggestions([])
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[Geocoding Search Error]', err)
        }
      } finally {
        clearTimeout(timeoutId)
        setSearchLoading(false)
      }
    }

    const delayDebounce = setTimeout(fetchSuggestions, 500)
    return () => {
      clearTimeout(delayDebounce)
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [searchQuery])

  // Manual geolocation prompt handler
  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      setError('Browser geolocation features are disabled or unsupported by your client browser.')
      return
    }

    if (geoDetectAbortRef.current) {
      geoDetectAbortRef.current.abort()
    }
    const controller = new AbortController()
    geoDetectAbortRef.current = controller
    const signal = controller.signal

    setLoading(true)
    setError(null)

    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 10000)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        
        let label = `Coordinates (${lat.toFixed(3)}, ${lon.toFixed(3)})`
        try {
          const revGeoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          const revRes = await fetch(revGeoUrl, { 
            headers: { 'User-Agent': 'AQI-Dashboard' },
            signal
          }).then(r => {
            if (!r.ok) throw new Error()
            return r.json()
          })
          if (revRes && revRes.display_name) {
            const city = revRes.address.city || revRes.address.town || revRes.address.village || revRes.address.suburb
            label = city ? `${city}, ${revRes.address.country || ''}` : revRes.display_name
          }
        } catch (e) {
          console.warn('[Reverse Geocode Failed] falling back to coordinates name', e)
        } finally {
          clearTimeout(timeoutId)
        }
        
        setLocationName(label)
        setCoords({ lat, lon })
      },
      () => {
        clearTimeout(timeoutId)
        setError('Location access permissions were denied or request timed out.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Suggestion click selection resolver
  const handleSelectSuggestion = (loc) => {
    if (!loc) return
    const label = [loc.name, loc.admin1, loc.country].filter(Boolean).join(', ')
    setLocationName(label)
    setCoords({ lat: loc.latitude, lon: loc.longitude })
    addToRecent(loc)
    setSearchQuery('')
    setShowSuggestions(false)
  }

  // Weather variables
  const currentTemp = weatherData?.current?.temperature_2m ?? null
  const currentHumidity = weatherData?.current?.relative_humidity_2m ?? null
  const currentRain = weatherData?.current?.rain ?? 0
  const currentWindSpeed = weatherData?.current?.wind_speed_10m ?? null
  const currentWindDir = weatherData?.current?.wind_direction_10m ?? null
  const currentVisibility = weatherData?.current?.visibility ?? null
  const temp80m = weatherData?.current?.temperature_80m ?? null
  const currentWeatherCode = weatherData?.current?.weather_code ?? 0

  const dailySunrise = weatherData?.daily?.sunrise?.[0] ? new Date(weatherData.daily.sunrise[0]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '-'
  const dailySunset = weatherData?.daily?.sunset?.[0] ? new Date(weatherData.daily.sunset[0]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '-'
  const rainSum = weatherData?.daily?.rain_sum?.[0] ?? 0
  const showersSum = weatherData?.daily?.showers_sum?.[0] ?? 0
  const maxWindSpeed = weatherData?.daily?.wind_speed_10m_max?.[0] ?? null

  // Safe Extraction logic for current AQI metrics
  const getParamVal = (aqObj, key) => {
    if (!aqObj) return 0
    if (aqObj.current && aqObj.current[key] !== undefined) return aqObj.current[key]
    if (aqObj.hourly && aqObj.hourly[key] && Array.isArray(aqObj.hourly.time)) {
      const nowStr = new Date().toISOString().slice(0, 13) + ":00"
      let idx = aqObj.hourly.time.findIndex(t => t && t.startsWith(nowStr.slice(0, 13)))
      if (idx === -1) {
        const localHourStr = new Date().toLocaleDateString('sv') + 'T' + String(new Date().getHours()).padStart(2, '0') + ':00'
        idx = aqObj.hourly.time.indexOf(localHourStr)
      }
      if (idx !== -1 && Array.isArray(aqObj.hourly[key])) return aqObj.hourly[key][idx] ?? 0
    }
    return 0
  }

  const currentPM25 = getParamVal(aqData, 'pm2_5')
  const currentPM10 = getParamVal(aqData, 'pm10')
  const currentOzone = getParamVal(aqData, 'ozone')
  const currentUV = getParamVal(aqData, 'uv_index')
  const currentNO2 = getParamVal(aqData, 'nitrogen_dioxide')
  const currentCO = getParamVal(aqData, 'carbon_monoxide')
  const currentDust = getParamVal(aqData, 'dust')
  
  // Calculate AQI category from both PM2.5 and PM10 values
  const pm25Aqi = getAqiFromPM25(currentPM25)
  const pm10Aqi = getAqiFromPM10(currentPM10)
  const currentAQI = Math.max(pm25Aqi, pm10Aqi)
  const aqiCategoryObj = classifyAQI(currentAQI)
  const healthAdv = HEALTH_ADVISORY[aqiCategoryObj.label] || HEALTH_ADVISORY.Good

  // Chart data formatting memoizations
  const hourlyChartData = useMemo(() => {
    if (!weatherData?.hourly || !aqData?.hourly) return []
    if (!Array.isArray(weatherData.hourly.time)) return []
    
    const nowStr = new Date().toISOString().slice(0, 13) + ":00"
    let startIndex = weatherData.hourly.time.findIndex(t => t && t.startsWith(nowStr.slice(0, 13)))
    if (startIndex === -1) {
      const localHourStr = new Date().toLocaleDateString('sv') + 'T' + String(new Date().getHours()).padStart(2, '0') + ':00'
      startIndex = weatherData.hourly.time.indexOf(localHourStr)
    }
    if (startIndex === -1) startIndex = 0

    const list = []
    const timeArr = weatherData.hourly.time
    for (let i = 0; i < 24; i++) {
      const idx = startIndex + i
      if (idx >= timeArr.length) break
      
      const rawTime = timeArr[idx]
      const label = rawTime ? new Date(rawTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''
      
      list.push({
        time: label,
        temp: parseFloat(((Array.isArray(weatherData.hourly.temperature_2m) ? weatherData.hourly.temperature_2m[idx] : null) ?? 0).toFixed(1)),
        humidity: Math.round((Array.isArray(weatherData.hourly.relative_humidity_2m) ? weatherData.hourly.relative_humidity_2m[idx] : null) ?? 0),
        pm25: parseFloat(((Array.isArray(aqData.hourly.pm2_5) ? aqData.hourly.pm2_5[idx] : null) ?? 0).toFixed(1)),
        pm10: parseFloat(((Array.isArray(aqData.hourly.pm10) ? aqData.hourly.pm10[idx] : null) ?? 0).toFixed(1)),
        ozone: parseFloat(((Array.isArray(aqData.hourly.ozone) ? aqData.hourly.ozone[idx] : null) ?? 0).toFixed(1)),
        uv: parseFloat(((Array.isArray(aqData.hourly.uv_index) ? aqData.hourly.uv_index[idx] : null) ?? 0).toFixed(1)),
      })
    }
    return list
  }, [weatherData, aqData])

  const weeklyForecastData = useMemo(() => {
    if (!weatherData?.daily) return []
    if (!Array.isArray(weatherData.daily.time)) return []
    return weatherData.daily.time.map((time, idx) => {
      const dateLabel = time ? new Date(time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : ''
      return {
        date: dateLabel,
        tempMax: (Array.isArray(weatherData.daily.temperature_2m_max) ? weatherData.daily.temperature_2m_max[idx] : null) ?? 0,
        tempMin: (Array.isArray(weatherData.daily.temperature_2m_min) ? weatherData.daily.temperature_2m_min[idx] : null) ?? 0,
        rainSum: (Array.isArray(weatherData.daily.rain_sum) ? weatherData.daily.rain_sum[idx] : null) ?? 0,
        showersSum: (Array.isArray(weatherData.daily.showers_sum) ? weatherData.daily.showers_sum[idx] : null) ?? 0,
        windMax: (Array.isArray(weatherData.daily.wind_speed_10m_max) ? weatherData.daily.wind_speed_10m_max[idx] : null) ?? 0,
        weatherCode: (Array.isArray(weatherData.daily.weather_code) ? weatherData.daily.weather_code[idx] : null) ?? 0,
      }
    })
  }, [weatherData])

  // EXPORT FUNCTIONS
  const handleExportCSV = () => {
    if (!hourlyChartData.length) return
    const headers = ['Time', 'Temperature (°C)', 'Humidity (%)', 'PM2.5 (µg/m³)', 'PM10 (µg/m³)', 'Ozone (µg/m³)', 'UV Index']
    const csvRows = [headers.join(',')]
    
    hourlyChartData.forEach(d => {
      csvRows.push([
        `"${d.time}"`,
        d.temp,
        d.humidity,
        d.pm25,
        d.pm10,
        d.ozone,
        d.uv
      ].join(','))
    })
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    const cleanLoc = locationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    link.setAttribute("download", `forecast_telemetry_${cleanLoc}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportJSON = () => {
    const exportPayload = {
      location: locationName,
      coordinates: coords,
      timestamp: new Date().toISOString(),
      currentWeather: {
        temp: currentTemp,
        humidity: currentHumidity,
        rain: currentRain,
        windSpeed: currentWindSpeed,
        windDirection: currentWindDir,
        windDirectionLabel: getWindDirectionLabel(currentWindDir),
        visibility: currentVisibility,
        temp80m: temp80m,
        weatherCode: currentWeatherCode,
        weatherText: getWeatherDetails(currentWeatherCode).label
      },
      currentAirQuality: {
        pm25: currentPM25,
        pm10: currentPM10,
        ozone: currentOzone,
        uvIndex: currentUV,
        no2: currentNO2,
        co: currentCO,
        dust: currentDust,
        calculatedAqi: currentAQI,
        aqiCategory: aqiCategoryObj.label
      },
      hourlyForecast: hourlyChartData,
      dailyForecast: weeklyForecastData
    }

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    const cleanLoc = locationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    link.setAttribute("download", `forecast_telemetry_${cleanLoc}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Custom tooltips styling for charts
  const renderChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-xl p-3 text-xs border border-cyan-400/20 backdrop-blur-md bg-[#0d1529]/95 text-slate-200">
        <p className="font-mono text-cyan-400 mb-1.5 font-semibold">{label}</p>
        <div className="space-y-1">
          {payload.map((item, index) => (
            <p key={index} className="flex justify-between gap-4">
              <span className="text-slate-400">{item.name}:</span>
              <span className="font-mono font-bold" style={{ color: item.color }}>
                {item.value} {item.unit || ''}
              </span>
            </p>
          ))}
        </div>
      </div>
    )
  }

  const currentWmoDetails = getWeatherDetails(currentWeatherCode)
  const WeatherWmoIcon = currentWmoDetails.icon

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 pb-20 relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* TOP STATUS HEADER PANEL */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[#0d1529]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-sm font-mono font-bold tracking-widest uppercase">
              <Sparkles size={14} className="animate-pulse" /> Environmental Telemetry
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <MapPin size={24} className="text-cyan-400 shrink-0" />
                {locationName}
              </h1>
              <span className="text-slate-500 text-xs font-mono">
                [Lat: {coords.lat.toFixed(4)}°, Lon: {coords.lon.toFixed(4)}°]
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm">Real-time air quality metrics and localized meteorological forecast stream.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Refresh countdown timer */}
            <div className="flex items-center gap-2 bg-black/30 border border-white/5 px-3 py-2 rounded-xl text-xs font-mono">
              <RefreshCw size={12} className={clsx("text-cyan-400", (loading || backgroundRefreshing) && "animate-spin")} />
              <span className="text-slate-400">Sync:</span>
              <span className="text-cyan-400 font-bold w-4 text-center">{countdown}s</span>
              
              <button 
                onClick={() => setPollingActive(!pollingActive)}
                className="ml-1 text-slate-500 hover:text-white transition-colors"
                title={pollingActive ? 'Pause auto-update' : 'Resume auto-update'}
              >
                {pollingActive ? <Pause size={10} /> : <Play size={10} />}
              </button>
            </div>

            {/* Geolocation Button */}
            <button 
              onClick={handleAutoDetect} 
              disabled={loading}
              className="px-4 py-2 border border-cyan-400/20 hover:border-cyan-400 hover:bg-cyan-400/10 text-cyan-400 rounded-xl text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <MapPin size={12} /> Detect Location
            </button>
            
            <button 
              onClick={() => fetchTelemetry(coords.lat, coords.lon, true)} 
              disabled={loading}
              className="px-4 py-2 bg-cyan-400 hover:bg-cyan-500 text-black font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Sync Live
            </button>
          </div>
        </div>

        {/* SEARCH BAR & AUTOCOMPLETE WRAPPER */}
        <div ref={searchRef} className="relative space-y-3 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search city, town, state, or country..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-[#0d1529]/60 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 font-sans transition-all"
            />
            {searchLoading && (
              <span className="absolute right-4 top-4 text-xs text-cyan-400 animate-pulse font-mono">Searching...</span>
            )}
          </div>

          {/* Autocomplete Droplist dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-[#0d1529]/95 border border-cyan-400/20 rounded-2xl overflow-hidden shadow-2xl z-50 backdrop-blur-xl max-w-xl mx-auto">
              <div className="max-h-[300px] overflow-y-auto divide-y divide-white/5">
                {suggestions.map((loc, idx) => (
                  <button
                    key={`${loc.latitude}-${loc.longitude}-${idx}`}
                    onClick={() => handleSelectSuggestion(loc)}
                    className="w-full text-left px-5 py-3 hover:bg-cyan-400/10 text-slate-300 hover:text-white transition-colors flex items-center justify-between text-xs sm:text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{loc.name}</span>
                      <span className="text-slate-400 text-xs font-mono">
                        {loc.admin1 ? `${loc.admin1}, ` : ''}{loc.country || ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px]">
                      <span>{loc.latitude.toFixed(2)}°N</span>
                      <span>·</span>
                      <span>{loc.longitude.toFixed(2)}°E</span>
                      <ChevronRight size={14} className="text-cyan-400 ml-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showSuggestions && searchQuery.trim().length >= 2 && suggestions.length === 0 && !searchLoading && (
            <div className="absolute left-0 right-0 mt-2 bg-[#0d1529]/95 border border-red-500/20 rounded-2xl p-4 text-center text-xs text-red-400 z-50 backdrop-blur-xl max-w-xl mx-auto">
              No matching locations found for "{searchQuery}".
            </div>
          )}

          {/* RECENT SEARCHES */}
          {recentSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <History size={11} /> Recent:
              </span>
              {recentSearches.map((item, idx) => (
                <button
                  key={`${item.latitude}-${item.longitude}-${idx}`}
                  onClick={() => {
                    setLocationName([item.name, item.admin1, item.country].filter(Boolean).join(', '))
                    setCoords({ lat: item.latitude, lon: item.longitude })
                  }}
                  className="px-2.5 py-1 bg-white/5 hover:bg-cyan-400/10 hover:text-cyan-400 border border-white/5 hover:border-cyan-400/20 text-slate-400 rounded-lg text-[10px] transition-all font-sans"
                >
                  {item.name}
                </button>
              ))}
              <button
                onClick={handleClearRecent}
                className="ml-auto text-slate-500 hover:text-red-400 p-1 transition-colors"
                title="Clear History"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-950/20 border border-red-500/20 text-red-300 p-4 rounded-2xl text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-red-200">Sensor Integration Error</p>
              <p className="text-slate-400 text-xs leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          /* SKELETON LOADING STATE */
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
              <div className="h-[380px] bg-slate-800/10 border border-white/5 rounded-3xl" />
              <div className="h-[380px] bg-slate-800/10 border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="h-6 bg-slate-800/30 rounded w-1/3" />
                <div className="h-16 bg-slate-800/20 rounded-xl" />
                <div className="h-24 bg-slate-800/20 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-800/10 border border-white/5 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : (
          /* MAIN METRIC LAYOUT DASHBOARD */
          <div className="space-y-8 fade-in-up">
            
            {/* ACTION BAR: EXPORT BUTTONS */}
            <div className="flex justify-end gap-2.5">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 bg-black/40 hover:bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Download size={12} /> Export CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="px-3.5 py-1.5 bg-black/40 hover:bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Download size={12} /> Export JSON
              </button>
            </div>

            {/* GRID SECTION 1: AQI GAUGE & HEALTH ADVISORY AND DETAILED SLIDERS */}
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
              
              {/* AQI RADIAL GAUGE CARD */}
              <div className="bg-[#0d1529]/80 border border-white/5 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-md relative overflow-hidden shadow-xl" style={{ background: 'var(--bg-card)' }}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/5 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity size={12} className="text-cyan-400" /> Air Quality Index
                  </h3>
                  <p className="text-xs text-slate-500">EPA standard US AQI calculated from PM2.5 and PM10 pollutants.</p>
                </div>

                <div className="my-6">
                  <AQIGauge aqi={currentAQI} size={240} />
                </div>

                {/* Classification label pills */}
                <div className="text-center space-y-1 pb-2">
                  <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-full border" style={{ borderColor: `${aqiCategoryObj.color}30`, color: aqiCategoryObj.color, background: `${aqiCategoryObj.color}05` }}>
                    {aqiCategoryObj.label}
                  </span>
                </div>
              </div>

              {/* HEALTH ADVISORY CARD */}
              <div className="bg-[#0d1529]/80 border border-white/5 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-md relative overflow-hidden shadow-xl" style={{ background: 'var(--bg-card)' }}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <HeartPulse size={18} className="text-cyan-400" /> Health Advisory & Advisory Guide
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500">EPA Standard Classification</span>
                  </div>

                  <div className="p-4 rounded-2xl space-y-2" style={{ background: healthAdv.bg, border: `1px solid ${healthAdv.color}15` }}>
                    <p className="font-semibold text-sm flex items-center gap-2" style={{ color: healthAdv.color }}>
                      <ShieldAlert size={16} /> Status: {healthAdv.status}
                    </p>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">{healthAdv.description}</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-mono text-slate-400 font-bold tracking-wider uppercase">Preventive Recommendations:</p>
                    <div className="grid gap-2">
                      {healthAdv.advice.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 bg-white/5 p-3 rounded-xl border border-white/5 text-xs text-slate-300 leading-normal">
                          <span className="text-cyan-400 font-mono mt-0.5">•</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 mt-4 border-t border-white/5 pt-3 leading-relaxed font-sans flex items-center justify-between">
                  <span>Standard parameters derived from US EPA calculations</span>
                  <span className="text-cyan-400/80 hover:text-cyan-400 cursor-help" title="Index is automatically generated using live air pollutant data.">Info</span>
                </div>
              </div>

            </div>

            {/* TAB SELECTOR FOR DETAILS GRIDS */}
            <div className="space-y-6">
              <div className="flex border-b border-white/5 pb-0.5 gap-6">
                {[
                  { id: 'weather', label: 'Meteorological Sensors', count: '8 stats', icon: Thermometer },
                  { id: 'aqi', label: 'Air Quality Pollutants', count: '7 particles', icon: Wind },
                ].map((tab) => {
                  const IconComp = tab.icon
                  const active = telemetryTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setTelemetryTab(tab.id)}
                      className={clsx(
                        "pb-3.5 text-xs sm:text-sm font-semibold transition-all relative flex items-center gap-2 focus:outline-none",
                        active ? "text-cyan-400 font-bold" : "text-slate-400 hover:text-white"
                      )}
                    >
                      <IconComp size={16} />
                      {tab.label}
                      <span className={clsx(
                        "text-[9px] font-mono px-2 py-0.5 rounded-full shrink-0 border",
                        active ? "bg-cyan-400/10 border-cyan-400/30 text-cyan-400" : "bg-white/5 border-white/10 text-slate-500"
                      )}>
                        {tab.count}
                      </span>
                      {active && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* DETAILS TELEMETRY DISPLAY */}
              {telemetryTab === 'weather' ? (
                /* METEOROLOGY GRID */
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Temperature (Ambient)', value: currentTemp !== null ? `${currentTemp.toFixed(1)}` : '-', unit: '°C', icon: Thermometer, color: 'text-orange-400', subtitle: currentWmoDetails.label },
                    { label: 'Relative Humidity', value: currentHumidity !== null ? `${currentHumidity}` : '-', unit: '%', icon: Droplets, color: 'text-blue-400' },
                    { label: 'Wind Velocity', value: currentWindSpeed !== null ? `${currentWindSpeed.toFixed(1)}` : '-', unit: 'km/h', icon: Wind, color: 'text-cyan-400', subtitle: currentWindDir !== null ? `${getWindDirectionLabel(currentWindDir)}` : '' },
                    { label: 'Visibility Range', value: currentVisibility !== null ? `${(currentVisibility / 1000).toFixed(1)}` : '-', unit: 'km', icon: Eye, color: 'text-purple-400' },
                    { label: 'Ambient Temp (80m)', value: temp80m !== null ? `${temp80m.toFixed(1)}` : '-', unit: '°C', icon: Thermometer, color: 'text-rose-400' },
                    { label: 'Maximum Wind Limit', value: maxWindSpeed !== null ? `${maxWindSpeed.toFixed(1)}` : '-', unit: 'km/h', icon: Wind, color: 'text-emerald-400' },
                    { label: 'Rain Rates (Current)', value: currentRain > 0 ? `${currentRain.toFixed(1)}` : '0.0', unit: 'mm/h', icon: CloudRain, color: 'text-indigo-400' },
                    { label: 'Day Rain Cumulative', value: rainSum > 0 ? `${rainSum.toFixed(1)}` : '0.0', unit: 'mm', icon: CloudRain, color: 'text-teal-400' },
                  ].map((card, idx) => {
                    const IconComp = card.icon
                    return (
                      <div key={idx} className="bg-[#0d1529]/80 border border-white/5 rounded-2xl p-5 hover:border-cyan-400/20 transition-all shadow-md group relative overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                        <div className="flex items-start justify-between mb-3">
                          {idx === 0 && WeatherWmoIcon ? <WeatherWmoIcon className={clsx("w-6 h-6 animate-pulse", currentWmoDetails.color)} /> : <IconComp className={clsx("w-5 h-5", card.color)} />}
                          {card.subtitle && (
                            <span className="text-[9px] font-mono bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-400/20 uppercase tracking-widest flex items-center gap-1 max-w-[120px] truncate">
                              {idx === 0 ? '' : <Compass size={8} />} {card.subtitle}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl sm:text-2xl font-display font-extrabold text-white">{card.value}</span>
                            {card.unit && <span className="text-xs text-slate-500 font-mono">{card.unit}</span>}
                          </div>
                          <p className="text-xs text-slate-400 font-medium font-sans leading-tight">{card.label}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* AIR QUALITY GRID (POLLUTANTS INDEX) */
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {[
                    { label: 'Fine PM2.5', value: currentPM25.toFixed(1), unit: 'µg/m³', limit: 12, displayLimit: 'EPA Limit: 12.0', color: '#ff4b4b' },
                    { label: 'Coarse PM10', value: currentPM10.toFixed(1), unit: 'µg/m³', limit: 54, displayLimit: 'EPA Limit: 54', color: '#ffa33f' },
                    { label: 'Ozone (O3)', value: currentOzone.toFixed(1), unit: 'µg/m³', limit: 100, displayLimit: 'EPA Limit: 100', color: '#22d3ee' },
                    { label: 'UV Index rating', value: currentUV.toFixed(1), unit: '', limit: 5, displayLimit: 'High UV: 5.0+', color: '#d946ef' },
                    { label: 'Nitrogen Dioxide', value: currentNO2.toFixed(1), unit: 'µg/m³', limit: 100, displayLimit: 'EPA Limit: 100', color: '#38bdf8' },
                    { label: 'Carbon Monoxide', value: currentCO.toFixed(1), unit: 'µg/m³', limit: 9000, displayLimit: 'EPA Limit: 9000', color: '#cbd5e1' },
                    { label: 'Coarse Dust', value: currentDust.toFixed(1), unit: 'µg/m³', limit: 150, displayLimit: 'EPA Limit: 150', color: '#eab308' },
                  ].map((card, idx) => {
                    const ratio = Math.min(100, (parseFloat(card.value) / card.limit) * 50)
                    return (
                      <div key={idx} className="bg-[#0d1529]/80 border border-white/5 rounded-2xl p-4 hover:border-cyan-400/20 transition-all shadow-md group flex flex-col justify-between" style={{ background: 'var(--bg-card)' }}>
                        <div className="space-y-2">
                          <p className="text-[11px] text-slate-400 font-semibold truncate leading-none">{card.label}</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg sm:text-xl font-display font-extrabold text-white">{card.value}</span>
                            {card.unit && <span className="text-[9px] text-slate-500 font-mono">{card.unit}</span>}
                          </div>
                        </div>

                        {/* EPA Relative Slider scale bar */}
                        <div className="mt-4 space-y-1">
                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${ratio}%`, backgroundColor: card.color }} />
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 block leading-tight">{card.displayLimit}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* TAB SELECTOR FOR DETAILED REAL-TIME HOURLY TIMELINE CHARTS */}
            <div className="bg-[#0d1529]/80 border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-xl" style={{ background: 'var(--bg-card)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <TrendingUp size={18} className="text-cyan-400" /> 24-Hour Trend & Profile Timelines
                  </h3>
                  <p className="text-xs text-slate-400">Localized timeline forecast graphs starting from the current hour.</p>
                </div>

                <div className="flex gap-1.5 bg-black/45 p-1 rounded-xl border border-white/5 w-fit">
                  {[
                    { id: 'weather', label: 'Temp & Humidity' },
                    { id: 'pollutants', label: 'PM2.5 & PM10' },
                    { id: 'uv_ozone', label: 'UV Index & Ozone' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setChartTab(tab.id)}
                      className={clsx(
                        "px-3.5 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all focus:outline-none",
                        chartTab === tab.id ? "bg-cyan-400 text-black shadow-md font-bold" : "text-slate-400 hover:text-white"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* RECHARTS CONTAINER PANEL */}
              <div className="h-[300px] w-full">
                {hourlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartTab === 'weather' ? (
                      <AreaChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                        <YAxis yAxisId="left" tick={{ fill: '#f97316', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#3b82f6', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                        <Tooltip content={renderChartTooltip} />
                        <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'sans-serif', paddingTop: '10px' }} />
                        <Area yAxisId="left" type="monotone" name="Temperature" unit="°C" dataKey="temp" stroke="#f97316" strokeWidth={2.5} fill="url(#tempGrad)" dot={false} activeDot={{ r: 4 }} />
                        <Area yAxisId="right" type="monotone" name="Humidity" unit="%" dataKey="humidity" stroke="#3b82f6" strokeWidth={2.5} fill="url(#humGrad)" dot={false} activeDot={{ r: 4 }} />
                      </AreaChart>
                    ) : chartTab === 'pollutants' ? (
                      <BarChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                        <Tooltip content={renderChartTooltip} />
                        <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'sans-serif', paddingTop: '10px' }} />
                        <Bar name="PM2.5 Pollution" unit="µg/m³" dataKey="pm25" fill="#ff4b4b" radius={[4, 4, 0, 0]} opacity={0.8} />
                        <Bar name="PM10 Pollution" unit="µg/m³" dataKey="pm10" fill="#ffa33f" radius={[4, 4, 0, 0]} opacity={0.8} />
                      </BarChart>
                    ) : (
                      <LineChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                        <YAxis yAxisId="left" tick={{ fill: '#d946ef', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#22d3ee', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                        <Tooltip content={renderChartTooltip} />
                        <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'sans-serif', paddingTop: '10px' }} />
                        <Line yAxisId="left" type="monotone" name="UV Index" unit="" dataKey="uv" stroke="#d946ef" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                        <Line yAxisId="right" type="monotone" name="Ozone Level" unit="µg/m³" dataKey="ozone" stroke="#22d3ee" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono">No hourly historical metrics present.</div>
                )}
              </div>
            </div>

            {/* 7-DAY FORECAST SECTION OUTLOOK */}
            <div className="bg-[#0d1529]/80 border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-xl" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-cyan-400" /> 7-Day Extended Weather & Rain Outlook
                </h3>
                <span className="text-[10px] font-mono text-slate-500">Weekly Meteorological Run</span>
              </div>

              {/* 7 cards horizontal container */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                {weeklyForecastData.map((day, idx) => {
                  const hasRain = day.rainSum > 0 || day.showersSum > 0
                  const dayWmo = getWeatherDetails(day.weatherCode)
                  const DayWmoIcon = dayWmo.icon

                  return (
                    <div key={idx} className="bg-black/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between items-center text-center hover:border-cyan-400/20 transition-all group">
                      <div className="space-y-1">
                        <p className="text-xs text-white font-semibold font-sans">{day.date.split(',')[0]}</p>
                        <p className="text-[10px] text-slate-500 font-mono leading-none">{day.date.split(',')[1]}</p>
                      </div>

                      {/* Symbolic representative icon */}
                      <div className="my-3 text-cyan-400 flex flex-col items-center gap-1">
                        {DayWmoIcon ? (
                          <DayWmoIcon className={clsx("w-8 h-8 group-hover:scale-110 transition-transform", dayWmo.color)} />
                        ) : (
                          <CloudSun className="w-8 h-8" />
                        )}
                        <span className="text-[8px] font-sans text-slate-400 max-w-[80px] truncate leading-none">{dayWmo.label}</span>
                      </div>

                      <div className="space-y-2 w-full font-mono">
                        {/* Temperature high/low */}
                        <div className="flex justify-center items-baseline gap-1.5">
                          <span className="text-xs text-orange-400 font-bold">{day.tempMax.toFixed(0)}°</span>
                          <span className="text-[10px] text-blue-400 font-semibold">{day.tempMin.toFixed(0)}°</span>
                        </div>

                        {/* Rain cumulative / wind limit metrics */}
                        <div className="border-t border-white/5 pt-2 space-y-0.5 text-[9px] text-slate-500 text-center">
                          <p className="flex justify-between px-1">
                            <span>Rain:</span>
                            <span className={clsx("font-bold", hasRain ? "text-cyan-400" : "text-slate-500")}>
                              {day.rainSum > 0 ? `${day.rainSum.toFixed(1)}m` : '0.0m'}
                            </span>
                          </p>
                          <p className="flex justify-between px-1">
                            <span>Wind:</span>
                            <span className="text-slate-400 font-semibold">{day.windMax.toFixed(0)}k/h</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ASTRONOMICAL / OTHER DETAILS CARD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* SUNRISE / SUNSET SUN CARD */}
              <div className="bg-[#0d1529]/85 border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-xl flex items-center justify-between" style={{ background: 'var(--bg-card)' }}>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Solar Transitions</h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">Atmospheric solar cycles for location.</p>
                  </div>
                  <div className="flex gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-none">Sunrise</p>
                      <p className="text-base sm:text-lg font-display font-extrabold text-amber-300">{dailySunrise}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-none">Sunset</p>
                      <p className="text-base sm:text-lg font-display font-extrabold text-orange-400">{dailySunset}</p>
                    </div>
                  </div>
                </div>
                <div className="w-14 h-14 bg-amber-400/10 rounded-full flex items-center justify-center border border-amber-400/20 text-amber-400 shrink-0">
                  <Sun size={28} className="animate-pulse" />
                </div>
              </div>

              {/* WATER ACCUMULATION METRICS CARD */}
              <div className="bg-[#0d1529]/85 border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-xl flex items-center justify-between" style={{ background: 'var(--bg-card)' }}>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Precipitation Metrics</h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">Combined rainfall totals forecast for today.</p>
                  </div>
                  <div className="flex gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-none">Rain Cumulative</p>
                      <p className="text-base sm:text-lg font-display font-extrabold text-blue-400">{rainSum.toFixed(1)} mm</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-none">Showers Cumulative</p>
                      <p className="text-base sm:text-lg font-display font-extrabold text-indigo-400">{showersSum.toFixed(1)} mm</p>
                    </div>
                  </div>
                </div>
                <div className="w-14 h-14 bg-blue-400/10 rounded-full flex items-center justify-center border border-blue-400/20 text-blue-400 shrink-0">
                  <CloudRain size={28} />
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  )
}
