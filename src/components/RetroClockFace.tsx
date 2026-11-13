import type { SystemData, TimeData } from './DigitalClock'
import SevenSegmentDigit from './SevenSegmentDigit'
import './RetroClockFace.css'

function DigitPair({ value }: { value: string }) {
  return (
    <div className="retro-digit-pair">
      {value.split('').map((digit, index) => (
        <SevenSegmentDigit key={index} digit={digit} />
      ))}
    </div>
  )
}

function WeatherSymbol({ condition }: { condition: string }) {
  const sun = /clear|sunny|mainly clear/i.test(condition)
  const cloud = /cloud|overcast|rain|drizzle|shower|storm|thunder|fog|mist/i.test(condition)
  const rain = /rain|drizzle|shower/i.test(condition)
  const storm = /storm|thunder/i.test(condition)
  const snow = /snow/i.test(condition)
  const fog = /fog|mist/i.test(condition)

  return (
    <svg className="retro-weather-symbol" viewBox="0 0 40 40" aria-hidden="true">
      {sun && (
        <>
          <circle cx="20" cy="20" r="8" />
          <path d="M20 2v5M20 33v5M2 20h5M33 20h5M7 7l4 4M29 29l4 4M7 33l4-4M29 11l4-4" />
        </>
      )}
      {cloud && <path d="M10 26a7 7 0 0 1-1-14 11 11 0 0 1 21-1 8 8 0 0 1 1 15H10Z" />}
      {rain && <path d="m12 31-2 5m12-5-2 5m12-5-2 5" />}
      {storm && <path d="m22 26-7 7h7l-4 6" />}
      {fog && <path d="M7 32h26M11 37h18" />}
      {snow && <path d="M20 4v32M6 12l28 16M6 28l28-16M16 7l4 4 4-4M16 33l4-4 4 4" />}
      {!sun && !cloud && !snow && (
        <>
          <circle cx="20" cy="20" r="14" strokeDasharray="3 4" />
          <path d="M16 15a4 4 0 1 1 7 3l-3 3v2M20 28h.1" />
        </>
      )}
    </svg>
  )
}

export default function RetroClockFace({ time, systemData }: { time: TimeData; systemData: SystemData }) {
  return (
    <div className="retro-clock-face">
      <div className="retro-clock-content">
        <div
          className="retro-time"
          role="timer"
          aria-live="off"
          aria-label={`${time.hours}:${time.minutes}:${time.seconds}${time.ampm ? ` ${time.ampm}` : ''}`}
        >
          <DigitPair value={time.hours} />
          <svg className="retro-colon" viewBox="0 0 20 180" aria-hidden="true">
            <path d="M5 47h10l3 3v15l-3 3H5l-3-3V50ZM5 112h10l3 3v15l-3 3H5l-3-3v-15Z" />
          </svg>
          <DigitPair value={time.minutes} />
          <div className="retro-time-side" aria-hidden="true">
            {time.ampm && <span className="retro-ampm">{time.ampm}</span>}
            <div className="retro-seconds">
              <DigitPair value={time.seconds} />
            </div>
          </div>
        </div>
        <div className="retro-date">{time.fullDate}</div>
      </div>
      <div className="retro-status">
        <div className="retro-weather">
          <WeatherSymbol condition={systemData.weather.condition} />
          <span>{systemData.weather.temp}</span>
          <span className="retro-condition" title={systemData.weather.condition}>
            {systemData.weather.condition}
          </span>
        </div>
        <div className="retro-cpu">CPU {systemData.cpuTemp}</div>
      </div>
    </div>
  )
}
