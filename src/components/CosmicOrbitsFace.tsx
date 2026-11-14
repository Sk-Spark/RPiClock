import type { TimeData } from './DigitalClock'
import { getClockHandAngles } from '../utils/timeFormat'
import { getDayOfYear, getIsoWeek } from '../utils/calendar'
import './CosmicOrbitsFace.css'

function OrbitRing({ radius, color, angle, label }: { radius: number; color: string; angle: number; label: string }) {
  const radians = angle * Math.PI / 180
  const circumference = 2 * Math.PI * radius
  return (
    <g style={{ color }} role="img" aria-label={`${label} ring at ${angle.toFixed(1)} degrees`}>
      <circle className="cosmic-ring-track" cx="160" cy="160" r={radius} />
      <circle className="cosmic-ring-progress" cx="160" cy="160" r={radius}
        strokeDasharray={`${circumference * angle / 360} ${circumference}`}
        transform="rotate(-90 160 160)" />
      <circle className="cosmic-ring-dot" cx={160 + Math.sin(radians) * radius} cy={160 - Math.cos(radians) * radius} r="3.5" />
    </g>
  )
}

export default function CosmicOrbitsFace({ time }: { time: Pick<TimeData, 'timestamp' | 'hours' | 'minutes' | 'ampm' | 'shortDate'> }) {
  const now = new Date(time.timestamp)
  const angles = getClockHandAngles({ hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds() })
  return (
    <div className="cosmic-orbits-face">
      <svg className="cosmic-stars" viewBox="0 0 800 480" preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: 180 }, (_, index) => (
          <circle key={index} cx={(index * 173 + 31) % 800} cy={(index * 97 + 19) % 480}
            r={index % 13 === 0 ? 1.5 : 0.6} fill={index % 7 === 0 ? '#eacb87' : '#7ec3ff'}
            opacity={0.15 + index % 6 * 0.12} />
        ))}
      </svg>
      <div className="cosmic-legend">
        <span><i style={{ background: '#ffc245' }} />Hours</span>
        <span><i style={{ background: '#04d5ff' }} />Minutes</span>
        <span><i style={{ background: '#ff51a1' }} />Seconds</span>
      </div>
      <div className="cosmic-clock">
        <svg viewBox="0 0 320 320" className="cosmic-rings">
          <OrbitRing radius={142} color="#ffc245" angle={angles.hourRotation} label="Hours" />
          <OrbitRing radius={116} color="#04d5ff" angle={angles.minuteRotation} label="Minutes" />
          <OrbitRing radius={88} color="#ff51a1" angle={angles.secondRotation} label="Seconds" />
        </svg>
        <div className="cosmic-clock-center">
          <div className="cosmic-time" role="timer" aria-live="off" aria-label={`${time.hours}:${time.minutes}${time.ampm ? ` ${time.ampm}` : ''}`}>
            {time.hours}:{time.minutes}
          </div>
          {time.ampm && <span className="cosmic-period">{time.ampm}</span>}
          <div className="cosmic-date">{time.shortDate}</div>
        </div>
      </div>
      <div className="cosmic-calendar">
        <span>Week {getIsoWeek(now)}</span>
        <span>Day {getDayOfYear(now)}</span>
      </div>
    </div>
  )
}
