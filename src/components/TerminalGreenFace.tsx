import { useEffect, useState } from 'react'
import type { TimeData } from './DigitalClock'
import BitmapText from './BitmapText'
import { textWidth } from '../utils/bitmapFont'
import './TerminalGreenFace.css'

interface SystemMetrics { temperature: number; cpuUsage: number | null; uptime: number; wifiQuality: number | null }

export default function TerminalGreenFace({ time }: { time: Pick<TimeData, 'timestamp' | 'hours' | 'hours24' | 'minutes' | 'seconds' | 'ampm' | 'shortDate'> }) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let stopped = false
    let timeout: number
    const update = async () => {
      try {
        const response = await fetch('/api/system', { signal: AbortSignal.timeout(4000) })
        if (!response.ok) throw new Error(`System metrics HTTP ${response.status}`)
        const data = await response.json()
        if (typeof data.temperature !== 'number' || !Number.isFinite(data.temperature) ||
            typeof data.uptime !== 'number' || !Number.isFinite(data.uptime) ||
            (data.cpuUsage !== null && (typeof data.cpuUsage !== 'number' || !Number.isFinite(data.cpuUsage))) ||
            (data.wifiQuality !== null && (typeof data.wifiQuality !== 'number' || !Number.isFinite(data.wifiQuality)))) {
          throw new Error('Invalid system metrics response')
        }
        if (!stopped) {
          setMetrics({ temperature: data.temperature, cpuUsage: data.cpuUsage, uptime: data.uptime, wifiQuality: data.wifiQuality })
          setError(null)
        }
      } catch (failure) {
        if (!stopped) {
          console.error('Terminal system metrics unavailable:', failure)
          setMetrics(null)
          setError('System metrics unavailable')
        }
      } finally {
        if (!stopped) timeout = window.setTimeout(update, 3000)
      }
    }
    void update()
    return () => { stopped = true; window.clearTimeout(timeout) }
  }, [])
  const main = `${time.hours}:${time.minutes}`
  const seconds = `:${time.seconds}`
  const date = `${time.shortDate} ${new Date(time.timestamp).getFullYear()}`
  const dayPercent = Math.round((Number(time.hours24) * 3600 + Number(time.minutes) * 60 + Number(time.seconds)) / 86400 * 100)
  const filled = Math.round(dayPercent / 5)
  const uptime = metrics ? `${Math.floor(metrics.uptime / 86400)}d ${Math.floor(metrics.uptime % 86400 / 3600)}h` : '--'
  const wifiQuality = metrics?.wifiQuality ?? null

  return (
    <div className="terminal-green-face">
      <header className="terminal-header"><span>pi@deskclock:~$ watch -n1 clock</span><span>{metrics ? '[ ONLINE ]' : error ? '[ OFFLINE ]' : '[ CONNECTING ]'}</span></header>
      <div className="terminal-body">
        <div className="terminal-clock-info">
          <svg className="terminal-time" viewBox="0 0 406 80" role="timer" aria-live="off"
            aria-label={`${main}:${time.seconds}${time.ampm ? ` ${time.ampm}` : ''}`}>
            <BitmapText text={main} step={10} shape="square" className="terminal-pixels" />
            <BitmapText text={seconds} step={5} x={305} y={32} shape="square" className="terminal-secondary-pixels" />
            {time.ampm && <BitmapText text={time.ampm} step={3} x={350} shape="square" className="terminal-pixels" />}
          </svg>
          <svg className="terminal-date" viewBox={`0 0 ${textWidth(date, 3)} 21`} role="img" aria-label={date}>
            <BitmapText text={date} step={3} shape="square" className="terminal-pixels" />
          </svg>
          <div className="terminal-day-progress" role="img" aria-label={`Day progress ${dayPercent}%`}>
            DAY [{ '#'.repeat(filled) }{ '.'.repeat(20 - filled) }] {dayPercent}%
          </div>
        </div>
        <section className="terminal-system" aria-label="System metrics">
          <h2>SYS</h2>
          <dl>
            <dt>CPU</dt><dd>{metrics?.cpuUsage === null || !metrics ? '--' : `${metrics.cpuUsage}%`}</dd>
            <dt>TEMP</dt><dd>{metrics ? `${metrics.temperature}°C` : '--°C'}</dd>
            <dt>UPTIME</dt><dd>{uptime}</dd>
            <dt>WIFI</dt><dd>
              {wifiQuality === null ? '--' : (
                <span className="terminal-wifi" role="img" aria-label={`Wi-Fi quality ${wifiQuality}%`}>
                  {[1, 2, 3, 4].map(bar => <i key={bar} style={{ height: bar * 6, opacity: wifiQuality > (bar - 1) * 25 ? 1 : 0.2 }} />)}
                </span>
              )}
            </dd>
          </dl>
          {error && <p role="alert">{error}</p>}
        </section>
      </div>
      <footer className="terminal-footer">pi@deskclock:~$ <span className="terminal-cursor" /></footer>
    </div>
  )
}
