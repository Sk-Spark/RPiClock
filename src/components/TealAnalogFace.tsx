import type { TimeData } from './DigitalClock'
import { formatClockHours, getClockHandAngles } from '../utils/timeFormat'
import type { ClockFaceProps } from '../utils/timeFormat'
import { getDayOfYear, getIsoWeek } from '../utils/calendar'
import './TealAnalogFace.css'

export default function TealAnalogFace({ time, timeFormat = '24' }: ClockFaceProps & { time: Pick<TimeData, 'timestamp'> }) {
  const now = new Date(time.timestamp)
  const local = formatClockHours(now.getHours(), timeFormat)
  const utc = formatClockHours(now.getUTCHours(), timeFormat)
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const utcMinutes = now.getUTCMinutes().toString().padStart(2, '0')
  const { hourRotation, minuteRotation, secondRotation } = getClockHandAngles({
    hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds()
  })
  const localLabel = `${local.hours}:${minutes}${local.ampm ? ` ${local.ampm}` : ''}`
  const utcLabel = `${utc.hours}:${utcMinutes}${utc.ampm ? ` ${utc.ampm}` : ''}`

  return (
    <div className="teal-analog-face">
      <svg className="teal-analog-dial" viewBox="0 0 320 320" role="img" aria-label={`Analog dial, ${localLabel}`}>
        <circle className="teal-dial-surface" cx="160" cy="160" r="150" />
        {Array.from({ length: 60 }, (_, index) => (
          <line
            key={index}
            className={index % 5 === 0 ? 'teal-hour-tick' : 'teal-minute-tick'}
            x1="160" y1="17" x2="160" y2={index % 5 === 0 ? 31 : 24}
            transform={`rotate(${index * 6} 160 160)`}
          />
        ))}
        {Array.from({ length: 12 }, (_, index) => {
          const number = index + 1
          const angle = number * Math.PI / 6
          return (
            <text
              key={number}
              className="teal-dial-number"
              x={160 + Math.sin(angle) * 108}
              y={160 - Math.cos(angle) * 108}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {number}
            </text>
          )
        })}
        <line className="teal-hour-hand" x1="160" y1="160" x2="160" y2="77" transform={`rotate(${hourRotation} 160 160)`} />
        <line className="teal-minute-hand" x1="160" y1="160" x2="160" y2="44" transform={`rotate(${minuteRotation} 160 160)`} />
        <line className="teal-second-hand" x1="160" y1="160" x2="160" y2="31" transform={`rotate(${secondRotation} 160 160)`} />
        <circle className="teal-dial-pin" cx="160" cy="160" r="5.5" />
      </svg>
      <div className="teal-analog-info">
        <div className="teal-weekday">{now.toLocaleDateString('en-GB', { weekday: 'long' })}</div>
        <div className="teal-local-time" role="timer" aria-live="off" aria-label={localLabel}>
          <span>{local.hours}:{minutes}</span>
          {local.ampm && <span className="teal-local-period">{local.ampm}</span>}
        </div>
        <div className="teal-date">{now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div className="teal-calendar-cards">
          <div className="teal-calendar-card" role="group" aria-label="ISO week">
            <span className="teal-card-label">Week</span>
            <span className="teal-card-value">{getIsoWeek(now)}</span>
          </div>
          <div className="teal-calendar-card" role="group" aria-label="Day of year">
            <span className="teal-card-label">Day</span>
            <span className="teal-card-value">{getDayOfYear(now)}</span>
          </div>
          <div className="teal-calendar-card" role="group" aria-label={`UTC ${utcLabel}`}>
            <span className="teal-card-label">UTC</span>
            <span className="teal-card-value teal-utc-time">{utc.hours}:{utcMinutes}</span>
            {utc.ampm && <span className="teal-utc-period">{utc.ampm}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
