import { useId, useState } from 'react'
import type { TimeData } from './DigitalClock'
import { digitPaths } from '../utils/digitPaths'
import './NixieClockFace.css'

export default function NixieClockFace({ time }: { time: Pick<TimeData, 'hours' | 'minutes' | 'ampm' | 'day' | 'shortDate'> }) {
  const glowId = useId()
  const [imageError, setImageError] = useState(false)
  const digits = `${time.hours}${time.minutes}`.split('')
  const positions = [126, 267, 451, 599]

  return (
    <div className="nixie-clock-face">
      <div className="nixie-clock-content">
        <img
          className="nixie-photo"
          src="/nixie-background.png"
          alt=""
          draggable={false}
          onError={() => {
            console.error('Nixie clock background image failed to load')
            setImageError(true)
          }}
          onLoad={() => setImageError(false)}
        />
        <svg
          className="nixie-clock-scene"
          viewBox="0 0 800 400"
          preserveAspectRatio="none"
          role="timer"
          aria-live="off"
          aria-label={`${time.hours}:${time.minutes}${time.ampm ? ` ${time.ampm}` : ''}`}
        >
          <defs>
            <filter id={glowId} x="-50%" y="-25%" width="200%" height="150%">
              <feGaussianBlur stdDeviation="2.5" />
            </filter>
          </defs>
          {digits.map((digit, index) => {
            const path = digitPaths[digit]
            if (!path) throw new RangeError(`Invalid Nixie digit: ${digit}`)
            return (
              <g key={index} className="nixie-tube" data-digit={digit} transform={`translate(${positions[index]} 84) scale(1.3 1.2)`}>
                <path d={path} className="nixie-digit-glow" filter={`url(#${glowId})`} />
                <path d={path} className="nixie-digit-orange" />
                <path d={path} className="nixie-digit-core" />
              </g>
            )
          })}
          {time.ampm && <text className="nixie-period" x="654" y="302">{time.ampm}</text>}
        </svg>
        <div className="nixie-date-plate">{time.day} {time.shortDate.slice(4)}</div>
        {imageError && <p className="nixie-background-error" role="alert">The clock background could not be loaded.</p>}
      </div>
    </div>
  )
}
