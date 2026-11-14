import type { TimeData, SystemData } from './DigitalClock'
import MatrixText from './BitmapText'
import { textWidth } from '../utils/bitmapFont'
import './AmberMatrixFace.css'

export default function AmberMatrixFace({ time, systemData }: {
  time: Pick<TimeData, 'hours' | 'minutes' | 'ampm' | 'shortDate'>
  systemData: Pick<SystemData, 'weather'>
}) {
  const main = `${time.hours}:${time.minutes}`
  const mainWidth = textWidth(main, 17)
  const periodWidth = time.ampm ? textWidth(time.ampm, 5) + 16 : 0
  const info = `${time.shortDate}   ${systemData.weather.temp}`

  return (
    <div className="amber-matrix-face">
      <svg
        className="matrix-time"
        viewBox={`0 0 ${mainWidth + periodWidth} 119`}
        role="timer"
        aria-live="off"
        aria-label={`${main}${time.ampm ? ` ${time.ampm}` : ''}`}
      >
        <MatrixText text={main} step={17} />
        {time.ampm && <MatrixText text={time.ampm} step={5} x={mainWidth + 16} y={42} />}
      </svg>
      <svg
        className="matrix-info"
        viewBox={`0 0 ${Math.max(1, textWidth(info, 6))} 42`}
        role="img"
        aria-label={`${time.shortDate}, outdoor temperature ${systemData.weather.temp}`}
      >
        <MatrixText text={info} step={6} />
      </svg>
    </div>
  )
}
