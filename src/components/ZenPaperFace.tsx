import { useState } from 'react'
import type { TimeData } from './DigitalClock'
import './ZenPaperFace.css'

export default function ZenPaperFace({ time }: { time: Pick<TimeData, 'timestamp' | 'hours' | 'minutes' | 'ampm' | 'day'> }) {
  const [imageError, setImageError] = useState(false)
  const date = new Date(time.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })

  return (
    <div className="zen-paper-face">
      <div className="zen-paper-scene">
        <img
          className="zen-paper-background"
          src="/zen-background.png"
          alt=""
          draggable={false}
          onError={() => {
            console.error('Zen Paper clock background image failed to load')
            setImageError(true)
          }}
          onLoad={() => setImageError(false)}
        />
        <div className="zen-paper-live">
          <div className="zen-paper-time" role="timer" aria-live="off" aria-label={`${time.hours}:${time.minutes}${time.ampm ? ` ${time.ampm}` : ''}`}>
            <span>{time.hours}:{time.minutes}</span>
            {time.ampm && <span className="zen-paper-period">{time.ampm}</span>}
          </div>
          <div className="zen-paper-date">{time.day} · {date}</div>
        </div>
      </div>
      {imageError && <p className="zen-paper-error" role="alert">The clock artwork could not be loaded.</p>}
    </div>
  )
}
