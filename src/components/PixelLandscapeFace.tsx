import { useState } from 'react'
import type { TimeData } from './DigitalClock'
import BitmapText from './BitmapText'
import { textWidth } from '../utils/bitmapFont'
import './PixelLandscapeFace.css'

export default function PixelLandscapeFace({ time }: { time: Pick<TimeData, 'hours' | 'minutes' | 'ampm' | 'shortDate'> }) {
  const [imageError, setImageError] = useState(false)
  const main = `${time.hours}:${time.minutes}`
  return (
    <div className="pixel-landscape-face">
      <div className="pixel-landscape-scene">
        <img className="pixel-landscape-background" src="/pixel-landscape.png" alt="" draggable={false}
          onError={() => { console.error('Pixel Landscape background failed to load'); setImageError(true) }}
          onLoad={() => setImageError(false)} />
        <div className="pixel-landscape-live">
          <div className="pixel-landscape-time" role="timer" aria-live="off" aria-label={`${main}${time.ampm ? ` ${time.ampm}` : ''}`}>
            <svg viewBox={`0 0 ${textWidth(main, 10)} 70`} aria-hidden="true">
              <BitmapText text={main} step={10} shape="square" pixelGap={0} className="landscape-pixels" />
            </svg>
            {time.ampm && <span className="pixel-landscape-period">{time.ampm}</span>}
          </div>
          <svg className="pixel-landscape-date" viewBox={`0 0 ${Math.max(1, textWidth(time.shortDate, 4))} 28`}
            role="img" aria-label={time.shortDate}>
            <BitmapText text={time.shortDate} step={4} shape="square" pixelGap={0} className="landscape-pixels" />
          </svg>
        </div>
      </div>
      {imageError && <p className="pixel-landscape-error" role="alert">The landscape artwork could not be loaded.</p>}
    </div>
  )
}
