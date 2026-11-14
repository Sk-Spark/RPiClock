import type { TimeData } from './DigitalClock'
import { digitPaths } from '../utils/digitPaths'
import './NeonClockFace.css'

export default function NeonClockFace({ time }: { time: Pick<TimeData, 'hours' | 'minutes' | 'ampm' | 'shortDate'> }) {
  const digits = `${time.hours}${time.minutes}`.split('')
  const offsets = [0, 64, 160, 224]

  return (
    <div className="neon-clock-face">
      <div className="neon-clock-content">
        <div className="neon-clock-time-row">
        <svg
          className="neon-clock-time"
          viewBox="0 0 284 104"
          preserveAspectRatio="none"
          role="timer"
          aria-live="off"
          aria-label={`${time.hours}:${time.minutes}${time.ampm ? ` ${time.ampm}` : ''}`}
        >
          {digits.map((digit, index) => {
            const path = digitPaths[digit]
            if (!path) throw new RangeError(`Invalid neon clock digit: ${digit}`)
            return <path key={index} d={path} transform={`translate(${offsets[index]} 2)`} />
          })}
          <circle cx="142" cy="34" r="2.3" />
          <circle cx="142" cy="70" r="2.3" />
        </svg>
          {time.ampm && <span className="neon-clock-ampm">{time.ampm}</span>}
        </div>
        <div className="neon-clock-date">{time.shortDate}</div>
      </div>
    </div>
  )
}
