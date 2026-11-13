import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import DigitalClock, { NeonClock, OrbitDigitalClock, RetroClock, TealAnalogClock } from './components/DigitalClock'
import AnalogClock from './components/AnalogClock'
import ClockSettings from './components/ClockSettings'
import type { ClockFaceProps, TimeFormat } from './utils/timeFormat'
import { getLocalDayKey, getNextMidnight } from './utils/calendar'
import './App.css'

// Define page configuration
interface PageConfig {
  id: string
  name: string
  component: React.ComponentType<ClockFaceProps>
}

const timeFormatStorageKey = 'rpiclock-time-format'

interface ClockSettingsState {
  timeFormat: TimeFormat
  storageError: string | null
}

function readClockSettings(): ClockSettingsState {
  if (typeof window === 'undefined') return { timeFormat: '24', storageError: null }
  try {
    const stored = window.localStorage.getItem(timeFormatStorageKey)
    if (stored === null || stored === '12' || stored === '24') {
      return { timeFormat: stored ?? '24', storageError: null }
    }
    console.warn('Invalid saved clock time format:', stored)
    return { timeFormat: '24', storageError: 'The saved time format was invalid. Select your preferred format again.' }
  } catch (error) {
    console.error('Failed to read clock settings:', error)
    return { timeFormat: '24', storageError: 'Saved settings could not be read. Changes may not survive a reload.' }
  }
}

const pages: PageConfig[] = [
  // { id: 'slideshow', name: 'Image Slideshow', component: ImageSlideshow },
  { id: 'digital', name: 'Digital Clock', component: DigitalClock },
  { id: 'analog', name: 'Analog Clock', component: AnalogClock },
  { id: 'retro-lcd', name: 'Retro LCD', component: RetroClock },
  { id: 'neon-red', name: 'Neon Red', component: NeonClock },
  { id: 'orbit-digital', name: 'Orbit Digital', component: OrbitDigitalClock },
  { id: 'teal-analog', name: 'Teal Analog', component: TealAnalogClock },
  // Add more pages here easily:
  // { id: 'modern', name: 'Modern Clock', component: ModernClock },
  // { id: 'world', name: 'World Clock', component: WorldClock },
]

function App() {
  const [clockSettings, setClockSettings] = useState(readClockSettings)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [interactionVersion, setInteractionVersion] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const suppressRevealClick = useRef(false)
  const lastRotationDay = useRef(getLocalDayKey(new Date()))
  const [searchParams, setSearchParams] = useSearchParams()
  const face = searchParams.get('face')
  const requestedIndex = face === null ? 0 : pages.findIndex(page => page.id === face)
  if (requestedIndex < 0) console.warn('Unknown clock face requested:', face)
  const currentPageIndex = Math.max(0, requestedIndex)
  
  const currentPage = pages[currentPageIndex]
  const previousPageIndex = (currentPageIndex + pages.length - 1) % pages.length
  const nextPageIndex = (currentPageIndex + 1) % pages.length

  useEffect(() => {
    const syncSettings = (event: StorageEvent) => {
      if (event.key === timeFormatStorageKey || event.key === null) {
        setClockSettings(readClockSettings())
      }
    }
    window.addEventListener('storage', syncSettings)
    return () => window.removeEventListener('storage', syncSettings)
  }, [])

  useEffect(() => {
    if (settingsOpen) return
    const timeout = window.setTimeout(() => setControlsVisible(false), 60000)
    return () => window.clearTimeout(timeout)
  }, [interactionVersion, settingsOpen])

  const handleInteraction = (event: PointerEvent<HTMLDivElement>) => {
    suppressRevealClick.current = !controlsVisible
    if (!controlsVisible) {
      event.preventDefault()
      event.stopPropagation()
    }
    setControlsVisible(true)
    setInteractionVersion(version => version + 1)
  }

  const handleSettingsOpenChange = (open: boolean) => {
    setSettingsOpen(open)
    setControlsVisible(true)
    setInteractionVersion(version => version + 1)
  }

  const changeTimeFormat = (timeFormat: TimeFormat) => {
    let storageError: string | null = null
    try {
      window.localStorage.setItem(timeFormatStorageKey, timeFormat)
    } catch (error) {
      console.error('Failed to save clock settings:', error)
      storageError = 'The format changed for this session, but could not be saved. It may reset after a reload.'
    }
    setClockSettings({ timeFormat, storageError })
  }

  const selectPage = useCallback((index: number, replace = false) => {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous)
      if (index === 0) next.delete('face')
      else next.set('face', pages[index].id)
      return next
    }, { replace })
  }, [setSearchParams])

  useEffect(() => {
    let timeout: number | undefined
    const checkMidnight = () => {
      if (timeout !== undefined) window.clearTimeout(timeout)
      const now = new Date()
      const today = getLocalDayKey(now)
      if (today > lastRotationDay.current) {
        lastRotationDay.current = today
        selectPage(nextPageIndex, true)
      }
      timeout = window.setTimeout(checkMidnight, Math.max(1, getNextMidnight(now).getTime() - now.getTime()))
    }
    const checkOnVisibility = () => {
      if (document.visibilityState === 'visible') checkMidnight()
    }
    checkMidnight()
    document.addEventListener('visibilitychange', checkOnVisibility)
    window.addEventListener('pageshow', checkMidnight)
    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout)
      document.removeEventListener('visibilitychange', checkOnVisibility)
      window.removeEventListener('pageshow', checkMidnight)
    }
  }, [nextPageIndex, selectPage])

  return (
    <div
      className="app"
      data-face={currentPage.id}
      onPointerDownCapture={handleInteraction}
      onPointerCancel={() => { suppressRevealClick.current = false }}
      onClickCapture={event => {
        if (suppressRevealClick.current) {
          suppressRevealClick.current = false
          event.preventDefault()
          event.stopPropagation()
        }
      }}
    >
      {/* Render current page component dynamically */}
      <currentPage.component timeFormat={clockSettings.timeFormat} />
      
      {/* QR Code for Admin access */}
      {/* <AdminQRCode /> */}
      
      <nav className="clock-navigation" aria-label="Clock face navigation" hidden={!controlsVisible}>
        <button
          type="button"
          className="face-navigation-button"
          onClick={() => selectPage(previousPageIndex)}
          aria-label={`Previous face: ${pages[previousPageIndex].name}`}
          title={`Previous face: ${pages[previousPageIndex].name}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>
        <div className="clock-controls-right">
          <button
            type="button"
            className="face-navigation-button"
            onClick={() => selectPage(nextPageIndex)}
            aria-label={`Next face: ${pages[nextPageIndex].name}`}
            title={`Next face: ${pages[nextPageIndex].name}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
          <ClockSettings
            timeFormat={clockSettings.timeFormat}
            onTimeFormatChange={changeTimeFormat}
            storageError={clockSettings.storageError}
            onOpenChange={handleSettingsOpenChange}
          />
        </div>
      </nav>
    </div>
  )
}

export default App
