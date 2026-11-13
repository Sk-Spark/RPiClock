import type { TimeData } from './DigitalClock'
import './NeonClockFace.css'

const digitPaths: Partial<Record<string, string>> = {
  '0': 'M30 4C10 4 6 20 6 50S10 96 30 96S54 80 54 50S50 4 30 4Z',
  '1': 'M16 20L31 4V96',
  '2': 'M6 24C8-2 52-4 54 23C56 42 41 51 28 64L6 96H54',
  '3': 'M6 20C12-3 54 0 54 24C54 42 40 48 26 48C42 48 57 53 57 73C57 101 15 104 5 83',
  '4': 'M43 96V4L5 69H57',
  '5': 'M52 4H10L6 48C17 41 55 35 55 72C55 101 16 103 6 86',
  '6': 'M51 12C35-4 7 11 7 53V72C7 107 55 102 55 72C55 43 19 41 7 61',
  '7': 'M5 4H55L18 96',
  '8': 'M30 4C2 4 3 47 30 47C59 47 59 96 30 96C1 96 1 47 30 47C57 47 58 4 30 4Z',
  '9': 'M53 40C53 9 42 4 30 4C-1 4 0 52 29 52C42 52 51 45 53 35V62C53 94 22 108 8 87'
}

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
