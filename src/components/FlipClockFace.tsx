import { useState } from 'react'
import type { SystemData, TimeData } from './DigitalClock'
import './FlipClockFace.css'

function FlipDigit({ digit }: { digit: string }) {
  const [display, setDisplay] = useState<{ current: string; previous: string | null }>({
    current: digit, previous: null
  })
  if (display.current !== digit) {
    setDisplay({ current: digit, previous: display.current })
  }

  return (
    <div className="flip-digit" aria-hidden="true">
      <div className="flip-digit-half flip-digit-top"><span>{digit}</span></div>
      <div className="flip-digit-half flip-digit-bottom"><span>{digit}</span></div>
      {display.previous !== null && (
        <>
          <div key={`hold-${digit}`} className="flip-digit-half flip-digit-bottom flip-digit-hold">
            <span>{display.previous}</span>
          </div>
          <div key={`top-${digit}`} className="flip-digit-half flip-digit-top flip-digit-outgoing">
            <span>{display.previous}</span>
          </div>
          <div key={`bottom-${digit}`} className="flip-digit-half flip-digit-bottom flip-digit-incoming">
            <span>{digit}</span>
          </div>
        </>
      )}
      <div className="flip-digit-seam" />
    </div>
  )
}

export default function FlipClockFace({ time, systemData }: { time: TimeData; systemData: SystemData }) {
  const now = new Date(time.timestamp)
  const dayProgress = (Number(time.hours24) * 3600 + Number(time.minutes) * 60 + Number(time.seconds)) / 86400 * 100

  return (
    <div className="flip-clock-face">
      <div className="flip-clock-content">
        <div className="flip-time-row">
          <div
            className="flip-time"
            role="timer"
            aria-live="off"
            aria-label={`${time.hours}:${time.minutes}:${time.seconds}${time.ampm ? ` ${time.ampm}` : ''}`}
          >
            <div className="flip-digit-pair">
              {time.hours.split('').map((digit, index) => <FlipDigit key={index} digit={digit} />)}
            </div>
            <div className="flip-colon" aria-hidden="true"><span /><span /></div>
            <div className="flip-digit-pair">
              {time.minutes.split('').map((digit, index) => <FlipDigit key={index} digit={digit} />)}
            </div>
            <div className="flip-time-side" aria-hidden="true">
              {time.ampm && <span className="flip-ampm">{time.ampm}</span>}
              <div className="flip-seconds">
                <div className="flip-digit-pair">
                  {time.seconds.split('').map((digit, index) => <FlipDigit key={index} digit={digit} />)}
                </div>
                <span className="flip-seconds-label">Seconds</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flip-calendar">
          <div className="flip-date">
            <span className="flip-weekday">{time.day}</span>
            <span>{now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
          </div>
          <progress className="flip-day-progress" value={dayProgress} max={100} aria-label="Day progress" />
        </div>
        <div className="flip-temperature-row">
          <div className="flip-temperature" role="group" aria-label="Outdoor temperature">
            <svg className="flip-temperature-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="8" cy="8" r="4" />
              <path d="M8 1v2M1 8h2M3 3l1.5 1.5M13 3l-1.5 1.5M5 20a4 4 0 0 1 0-8 6 6 0 0 1 11-1 4.5 4.5 0 1 1 2 9H5Z" />
            </svg>
            <span className="flip-temperature-value">{systemData.weather.temp}</span>
            <span className="flip-weather-condition" title={systemData.weather.condition}>{systemData.weather.condition}</span>
          </div>
          <div className="flip-temperature" role="group" aria-label="CPU temperature">
            <svg className="flip-temperature-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="5" width="14" height="14" rx="2" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
              <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
            </svg>
            <span className="flip-temperature-value">{systemData.cpuTemp}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
