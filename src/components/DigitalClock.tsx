import React, { useState, useEffect } from 'react'
import RetroClockFace from './RetroClockFace'
import NeonClockFace from './NeonClockFace'
import OrbitDigitalFace from './OrbitDigitalFace'
import TealAnalogFace from './TealAnalogFace'
import FlipClockFace from './FlipClockFace'
import NixieClockFace from './NixieClockFace'
import ZenPaperFace from './ZenPaperFace'
import AmberMatrixFace from './AmberMatrixFace'
import CosmicOrbitsFace from './CosmicOrbitsFace'
import TerminalGreenFace from './TerminalGreenFace'
import PixelLandscapeFace from './PixelLandscapeFace'
import { formatClockHours } from '../utils/timeFormat'
import type { ClockFaceProps } from '../utils/timeFormat'
import './DigitalClock.css'

export interface TimeData {
  timestamp: number
  hours: string
  hours24: string
  minutes: string
  seconds: string
  ampm: string
  date: string
  day: string
  fullDate: string
  shortDate: string
}

export interface SystemData {
  cpuTemp: string
  weather: {
    temp: string
    condition: string
    icon: string
  }
  location: {
    city: string
    country: string
  }
}

const DigitalClock: React.FC<ClockFaceProps & { variant?: 'modern' | 'retro' | 'neon' | 'orbit' | 'teal' | 'flip' | 'nixie' | 'zen' | 'matrix' | 'cosmic' | 'terminal' | 'landscape' }> = ({
  variant = 'modern', timeFormat = '24'
}) => {
  const [time, setTime] = useState<TimeData>({
    timestamp: Date.now(),
    hours: '00',
    hours24: '00',
    minutes: '00',
    seconds: '00',
    ampm: 'AM',
    date: '',
    day: '',
    fullDate: '',
    shortDate: ''
  })

  const [systemData, setSystemData] = useState<SystemData>({
    cpuTemp: '--°C',
    weather: {
      temp: '--°C',
      condition: 'Loading...',
      icon: '🌤️'
    },
    location: {
      city: '--',
      country: '--'
    }
  })

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours24 = now.getHours()
      const hours12 = hours24 % 12 || 12
      const minutes = now.getMinutes()
      const seconds = now.getSeconds()
      const ampm = hours24 >= 12 ? 'PM' : 'AM'

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December']

      const day = days[now.getDay()]
      const month = months[now.getMonth()]
      const date = `${month} ${now.getDate()}, ${now.getFullYear()}`

      setTime({
        timestamp: now.getTime(),
        hours: hours12.toString().padStart(2, '0'),
        hours24: hours24.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0'),
        ampm,
        date,
        day,
        fullDate: `${day} ${now.getDate()} ${month} ${now.getFullYear()}`,
        shortDate: `${day.slice(0, 3)} ${now.getDate().toString().padStart(2, '0')} ${month.slice(0, 3)}`
      })
    }

    const updateSystemData = async () => {
      try {
        // Fetch CPU temperature
        const cpuTemp = await fetchCPUTemperature()
        setSystemData(previous => ({ ...previous, cpuTemp }))
        
        // Fetch weather and location data
        const weatherAndLocation = await fetchWeatherData()
        
        setSystemData({
          cpuTemp,
          weather: weatherAndLocation.weather,
          location: weatherAndLocation.location
        })
      } catch (error) {
        console.error('Failed to fetch system data:', error)
      }
    }

    updateTime()
    const showSystemInfo = variant === 'modern' || variant === 'retro' || variant === 'flip' || variant === 'matrix'
    if (showSystemInfo) updateSystemData()
    
    const timeInterval = setInterval(updateTime, 1000)
    const systemInterval = showSystemInfo ? setInterval(updateSystemData, 30000) : undefined

    return () => {
      clearInterval(timeInterval)
      if (systemInterval !== undefined) clearInterval(systemInterval)
    }
  }, [variant])

  const fetchCPUTemperature = async (): Promise<string> => {
    try {
      // Try to read from local CPU temperature service
      const response = await fetch('http://localhost:3001')
      if (!response.ok) {
        throw new Error(`CPU temperature API error: ${response.status}`)
      }
      const data = await response.json()
      if (typeof data.temperature !== 'number' || !Number.isFinite(data.temperature)) {
        throw new Error('CPU temperature API returned invalid data')
      }
      return `${Math.round(data.temperature)}°C`
    } catch (error) {
      console.warn('Failed to read CPU temperature:', error)
      return '--°C'
    }
  }

  const fetchWeatherData = async () => {
    try {
      // Get location from environment variables (config)
      const latitude = parseFloat(import.meta.env.VITE_DEFAULT_LAT || '17.3968')
      const longitude = parseFloat(import.meta.env.VITE_DEFAULT_LON || '78.3348')
      
      // Use free weather API (wttr.in) - no API key required
      const weatherUrl = `https://wttr.in/${latitude},${longitude}?format=j1`
      
      const response = await fetch(weatherUrl)
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`)
      }
      
      const weatherData = await response.json()
      const current = weatherData.current_condition[0]
      const locationInfo = weatherData.nearest_area[0]
      
      return {
        weather: {
          temp: `${current.temp_C}°C`,
          condition: current.weatherDesc[0].value,
          icon: getWeatherIconFromCondition(current.weatherCode)
        },
        location: {
          city: locationInfo.areaName[0].value,
          country: locationInfo.country[0].value
        }
      }
    } catch (error) {
      console.warn('Failed to fetch weather data, trying fallback APIs:', error)
      return await fetchWeatherFallback()
    }
  }

  const fetchWeatherFallback = async () => {
    try {
      // Fallback: Use open-meteo.com (completely free, no API key)
      // Get location from environment variables (config)
      const latitude = parseFloat(import.meta.env.VITE_DEFAULT_LAT || '17.3968')
      const longitude = parseFloat(import.meta.env.VITE_DEFAULT_LON || '78.3348')
      
      // Get location name using reverse geocoding
      const locationData = await fetchLocationName(latitude, longitude)
      
      const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`
      
      const response = await fetch(meteoUrl)
      if (!response.ok) {
        throw new Error(`Fallback weather API error: ${response.status}`)
      }
      
      const weatherData = await response.json()
      const current = weatherData.current_weather
      
      return {
        weather: {
          temp: `${Math.round(current.temperature)}°C`,
          condition: getWeatherConditionFromCode(current.weathercode),
          icon: getWeatherIconFromWMOCode(current.weathercode)
        },
        location: locationData
      }
    } catch (error) {
      console.warn('All weather APIs failed:', error)
      return {
        weather: {
          temp: '--°C',
          condition: 'Service unavailable',
          icon: '🌤️'
        },
        location: {
          city: 'Unknown',
          country: 'Unknown'
        }
      }
    }
  }

  const fetchLocationName = async (latitude: number, longitude: number) => {
    try {
      // Use free reverse geocoding API
      const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      
      const response = await fetch(geoUrl)
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`)
      }
      
      const locationData = await response.json()
      
      return {
        city: locationData.city || locationData.locality || locationData.principalSubdivision || 'Unknown',
        country: locationData.countryName || 'Unknown'
      }
    } catch (error) {
      console.warn('Failed to fetch location name:', error)
      return {
        city: 'Unknown',
        country: 'Unknown'
      }
    }
  }

  // Location is now configured via environment variables
  // No need for browser geolocation

  const getWeatherIconFromCondition = (weatherCode: string): string => {
    // wttr.in weather codes
    const code = parseInt(weatherCode)
    if (code >= 200 && code < 300) return '⛈️' // thunderstorm
    if (code >= 300 && code < 400) return '🌦️' // drizzle
    if (code >= 500 && code < 600) return '🌧️' // rain
    if (code >= 600 && code < 700) return '🌨️' // snow
    if (code >= 700 && code < 800) return '🌫️' // atmosphere
    if (code === 800) return '☀️' // clear
    if (code > 800) return '☁️' // clouds
    return '🌤️' // default
  }

  const getWeatherIconFromWMOCode = (wmoCode: number): string => {
    // WMO Weather interpretation codes (open-meteo)
    const iconMap: { [key: number]: string } = {
      0: '☀️',   // Clear sky
      1: '🌤️',   // Mainly clear
      2: '⛅',   // Partly cloudy
      3: '☁️',   // Overcast
      45: '🌫️',  // Fog
      48: '🌫️',  // Depositing rime fog
      51: '🌦️',  // Light drizzle
      53: '🌦️',  // Moderate drizzle
      55: '🌦️',  // Dense drizzle
      61: '🌧️',  // Slight rain
      63: '🌧️',  // Moderate rain
      65: '🌧️',  // Heavy rain
      71: '🌨️',  // Slight snow
      73: '🌨️',  // Moderate snow
      75: '🌨️',  // Heavy snow
      95: '⛈️',  // Thunderstorm
      96: '⛈️',  // Thunderstorm with hail
      99: '⛈️'   // Thunderstorm with heavy hail
    }
    
    return iconMap[wmoCode] || '🌤️'
  }

  const getWeatherConditionFromCode = (wmoCode: number): string => {
    // WMO Weather interpretation codes descriptions
    const conditionMap: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      95: 'Thunderstorm',
      96: 'Thunderstorm with hail',
      99: 'Thunderstorm with heavy hail'
    }
    
    return conditionMap[wmoCode] || 'Unknown'
  }

  const displayTime = { ...time, ...formatClockHours(Number(time.hours24), timeFormat) }

  if (variant === 'retro') {
    return <RetroClockFace time={displayTime} systemData={systemData} />
  }
  if (variant === 'neon') {
    return <NeonClockFace time={displayTime} />
  }
  if (variant === 'orbit') {
    return <OrbitDigitalFace time={time} timeFormat={timeFormat} />
  }
  if (variant === 'teal') {
    return <TealAnalogFace time={time} timeFormat={timeFormat} />
  }
  if (variant === 'flip') {
    return <FlipClockFace time={displayTime} systemData={systemData} />
  }
  if (variant === 'nixie') {
    return <NixieClockFace time={displayTime} />
  }
  if (variant === 'zen') {
    return <ZenPaperFace time={displayTime} />
  }
  if (variant === 'matrix') {
    return <AmberMatrixFace time={displayTime} systemData={systemData} />
  }
  if (variant === 'cosmic') {
    return <CosmicOrbitsFace time={displayTime} />
  }
  if (variant === 'terminal') {
    return <TerminalGreenFace time={displayTime} />
  }
  if (variant === 'landscape') {
    return <PixelLandscapeFace time={displayTime} />
  }

  return (
    <div className="digital-clock-page">
      <div className="digital-container">
        {/* Digital Display */}
        <div className="digital-display">
          <div
            className="time-display"
            role="timer"
            aria-live="off"
            aria-label={`${displayTime.hours}:${time.minutes}${displayTime.ampm ? ` ${displayTime.ampm}` : ''}`}
          >
            <span className="hours">{displayTime.hours}</span>
            <span className="separator">:</span>
            <span className="minutes">{time.minutes}</span>
            {displayTime.ampm && <span className="ampm">{displayTime.ampm}</span>}
          </div>
          <div className="date-display">
            <div className="day">{time.day}</div>
            <div className="date">{time.date}</div>
          </div>
          
          {/* System Info Display */}
          <div className="system-info">
            <div className="weather-info">
              <span className="weather-icon">{systemData.weather.icon}</span>
              <span className="weather-temp">{systemData.weather.temp}</span>
              <span className="weather-condition">{systemData.weather.condition}</span>
              <div className="location-info">
                <span className="location-text">{systemData.location.city}, {systemData.location.country}</span>
              </div>
            </div>
            <div className="cpu-info">
              <span className="cpu-label">CPU</span>
              <span className="cpu-temp">{systemData.cpuTemp}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function RetroClock(props: ClockFaceProps) {
  return <DigitalClock {...props} variant="retro" />
}

export function NeonClock(props: ClockFaceProps) {
  return <DigitalClock {...props} variant="neon" />
}

export function OrbitDigitalClock(props: ClockFaceProps) {
  return <DigitalClock {...props} variant="orbit" />
}

export function TealAnalogClock(props: ClockFaceProps) {
  return <DigitalClock {...props} variant="teal" />
}

export function FlipClock(props: ClockFaceProps) {
  return <DigitalClock {...props} variant="flip" />
}

export function NixieClock(props: ClockFaceProps) {
  return <DigitalClock {...props} variant="nixie" />
}

export function ZenPaperClock(props: ClockFaceProps) {
  return <DigitalClock {...props} variant="zen" />
}

export function AmberMatrixClock(props: ClockFaceProps) {
  return <DigitalClock {...props} variant="matrix" />
}

export function CosmicOrbitsClock(props: ClockFaceProps) {
  return <DigitalClock {...props} variant="cosmic" />
}

export function TerminalGreenClock(props: ClockFaceProps) {
  return <DigitalClock {...props} variant="terminal" />
}

export function PixelLandscapeClock(props: ClockFaceProps) {
  return <DigitalClock {...props} variant="landscape" />
}

export default DigitalClock