import { readFile } from 'node:fs/promises'
import os from 'node:os'

interface CpuTicks { idle: number; total: number }
interface MetricSources {
  readTemperature: () => Promise<string>
  readWireless: () => Promise<string>
  cpuTicks: () => CpuTicks
  uptime: () => number
}

function cpuTicks(): CpuTicks {
  return os.cpus().reduce((sum, cpu) => ({
    idle: sum.idle + cpu.times.idle,
    total: sum.total + Object.values(cpu.times).reduce((total, value) => total + value, 0)
  }), { idle: 0, total: 0 })
}

export function createSystemMetricsReader(sources: Partial<MetricSources> = {}) {
  const readTemperature = sources.readTemperature ?? (() => readFile('/sys/class/thermal/thermal_zone0/temp', 'utf8'))
  const readWireless = sources.readWireless ?? (() => readFile('/proc/net/wireless', 'utf8'))
  const sample = sources.cpuTicks ?? cpuTicks
  const uptime = sources.uptime ?? os.uptime
  let previous = sample()
  return async () => {
    const [reading, wireless] = await Promise.all([readTemperature(), readWireless()])
    const temperature = Number(reading) / 1000
    if (!reading.trim() || !Number.isFinite(temperature)) throw new Error('Invalid CPU temperature sensor data')
    const current = sample()
    const totalDelta = current.total - previous.total
    const idleDelta = current.idle - previous.idle
    previous = current
    const cpuUsage = totalDelta > 0 ? Math.max(0, Math.min(100, Math.round((1 - idleDelta / totalDelta) * 100))) : null
    const link = wireless.match(/^\s*[\w.-]+:\s+\w+\s+([\d.]+)/m)
    const quality = link ? Number(link[1]) : null
    if (quality !== null && !Number.isFinite(quality)) throw new Error('Invalid Wi-Fi link quality')
    const uptimeSeconds = uptime()
    if (!Number.isFinite(uptimeSeconds) || uptimeSeconds < 0) throw new Error('Invalid system uptime')
    return {
      temperature: Math.round(temperature), cpuUsage, uptime: uptimeSeconds,
      wifiQuality: quality === null ? null : Math.max(0, Math.min(100, Math.round(quality / 70 * 100)))
    }
  }
}
