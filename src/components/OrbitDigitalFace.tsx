import { useId } from 'react'
import type { TimeData } from './DigitalClock'
import { formatClockHours } from '../utils/timeFormat'
import type { ClockFaceProps } from '../utils/timeFormat'
import { getIsoWeek } from '../utils/calendar'
import './OrbitDigitalFace.css'

export default function OrbitDigitalFace({ time, timeFormat = '24' }: ClockFaceProps & { time: Pick<TimeData, 'timestamp'> }) {
  const gradientId = useId()
  const now = new Date(time.timestamp)
  const hour = now.getHours()
  const { hours, ampm } = formatClockHours(hour, timeFormat)
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const date = now.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const elapsed = hour * 3600 + now.getMinutes() * 60 + seconds
  const dayProgress = Math.round(elapsed / 86400 * 100)
  const angle = seconds / 60 * Math.PI * 2
  const arcEndX = 120 - Math.sin(angle) * 110
  const arcEndY = 120 - Math.cos(angle) * 110

  return (
    <div className="orbit-digital-face">
      <div className="orbit-digital-info">
        <div className="orbit-greeting">{greeting}</div>
        <div className="orbit-time" role="timer" aria-live="off" aria-label={`${hours}:${minutes}${ampm ? ` ${ampm}` : ''}`}>
          <span>{hours}</span>
          <span className="orbit-time-separator">:</span>
          <span className="orbit-minutes">{minutes}</span>
          {ampm && <span className="orbit-ampm">{ampm}</span>}
        </div>
        <div className="orbit-date">{date}</div>
        <div className="orbit-day-progress">
          <progress value={elapsed} max={86400} aria-label="Day progress" />
          <div className="orbit-progress-caption">
            <span>Day progress</span>
            <span>{dayProgress}%</span>
          </div>
        </div>
      </div>
      <div className="orbit-seconds-circle" role="img" aria-label={`${seconds} seconds`}>
        <svg viewBox="0 0 240 240" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="40" y1="30" x2="200" y2="220">
              <stop offset="0%" stopColor="#287aff" />
              <stop offset="100%" stopColor="#a443fb" />
            </linearGradient>
          </defs>
          <circle className="orbit-ring-track" cx="120" cy="120" r="110" />
          {seconds > 0 && (
            <path
              className="orbit-ring-progress"
              d={`M120 10 A110 110 0 ${seconds > 30 ? 1 : 0} 0 ${arcEndX} ${arcEndY}`}
              stroke={`url(#${gradientId})`}
            />
          )}
        </svg>
        <div className="orbit-seconds-content" aria-hidden="true">
          <span className="orbit-seconds-value">{seconds.toString().padStart(2, '0')}</span>
          <span className="orbit-seconds-label">Seconds</span>
          <span className="orbit-week">Week {getIsoWeek(now)}</span>
        </div>
      </div>
    </div>
  )
}
