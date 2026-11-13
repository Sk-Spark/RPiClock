import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export function createCpuTemperatureServer(
  readTemperature = () => readFile('/sys/class/thermal/thermal_zone0/temp', 'utf8')
) {
  return http.createServer(async (req, res) => {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, headers)
      res.end()
      return
    }

    if (req.method !== 'GET' || req.url !== '/') {
      res.writeHead(404, headers)
      res.end(JSON.stringify({ error: 'Not found' }))
      return
    }

    try {
      const reading = await readTemperature()
      const millidegrees = Number(reading)
      if (!reading.trim() || !Number.isFinite(millidegrees)) {
        throw new Error('CPU temperature sensor returned invalid data')
      }
      res.writeHead(200, headers)
      res.end(JSON.stringify({
        temperature: Math.trunc(millidegrees / 1000),
        unit: 'C',
        timestamp: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Failed to read CPU temperature:', error)
      res.writeHead(503, headers)
      res.end(JSON.stringify({
        error: 'CPU temperature sensor not available',
        timestamp: new Date().toISOString()
      }))
    }
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.argv[2] ?? '3001')
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('CPU API port must be an integer between 1 and 65535')
    process.exit(1)
  }
  const server = createCpuTemperatureServer()
  server.on('error', error => {
    console.error('CPU temperature API listener failed:', error)
    process.exit(1)
  })
  server.listen(port, '127.0.0.1', () => {
    console.log(`CPU temperature API listening on http://127.0.0.1:${port}`)
  })
}
