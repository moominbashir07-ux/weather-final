export const AQI_CATEGORIES = [
  { max: 50, label: 'Good', color: '#00E400', bg: 'rgba(0,228,0,0.1)', text: 'text-green-400' },
  { max: 100, label: 'Moderate', color: '#FFFF00', bg: 'rgba(255,255,0,0.1)', text: 'text-yellow-300' },
  { max: 150, label: 'Unhealthy for Sensitive Groups', color: '#FF7E00', bg: 'rgba(255,126,0,0.1)', text: 'text-orange-400' },
  { max: 200, label: 'Unhealthy', color: '#FF0000', bg: 'rgba(255,0,0,0.1)', text: 'text-red-500' },
  { max: 300, label: 'Very Unhealthy', color: '#8F3F97', bg: 'rgba(143,63,151,0.1)', text: 'text-purple-400' },
  { max: Infinity, label: 'Hazardous', color: '#7E0023', bg: 'rgba(126,0,35,0.1)', text: 'text-rose-600' },
]

export function classifyAQI(aqi) {
  return AQI_CATEGORIES.find((c) => aqi <= c.max) || AQI_CATEGORIES[5]
}

export function formatAQI(aqi) {
  return Math.round(aqi)
}

export const DEFAULT_FORM = {
  temperature: 25,
  humidity: 60,
  wind_speed: 10,
  co2: 450,
  pm25: 35,
  pm10: 70,
  no2: 40,
  so2: 20,
}

export const PARAM_LABELS = {
  temperature: { label: 'Temperature', unit: '°C', icon: '🌡️', min: -20, max: 60, step: 0.5 },
  humidity: { label: 'Humidity', unit: '%', icon: '💧', min: 0, max: 100, step: 1 },
  wind_speed: { label: 'Wind Speed', unit: 'km/h', icon: '💨', min: 0, max: 100, step: 0.5 },
  co2: { label: 'CO₂', unit: 'ppm', icon: '🏭', min: 300, max: 2000, step: 10 },
  pm25: { label: 'PM2.5', unit: 'µg/m³', icon: '🔴', min: 0, max: 500, step: 1 },
  pm10: { label: 'PM10', unit: 'µg/m³', icon: '🟠', min: 0, max: 600, step: 1 },
  no2: { label: 'NO₂', unit: 'µg/m³', icon: '⚗️', min: 0, max: 300, step: 1 },
  so2: { label: 'SO₂', unit: 'µg/m³', icon: '☁️', min: 0, max: 300, step: 1 },
}
