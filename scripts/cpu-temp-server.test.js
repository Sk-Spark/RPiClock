import assert from 'node:assert/strict'
import { once } from 'node:events'
import { test } from 'node:test'
import { createCpuTemperatureServer } from './cpu-temp-server.js'

async function listen(t, readTemperature) {
  const server = createCpuTemperatureServer(readTemperature)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise((resolve, reject) => {
    server.closeAllConnections()
    server.close(error => error ? reject(error) : resolve())
  }))
  return `http://127.0.0.1:${server.address().port}/`
}

test('serves fresh temperature data for repeated and concurrent requests', async t => {
  let reading = 51000
  const url = await listen(t, async () => {
    const value = String(reading)
    reading += 1000
    return value
  })
  for (let i = 0; i < 2; i++) {
    const response = await fetch(url)
    assert.equal(response.status, 200)
    const data = await response.json()
    assert.equal(data.temperature, 51 + i)
    assert.equal(data.unit, 'C')
    assert.ok(Number.isFinite(Date.parse(data.timestamp)))
    assert.equal(response.headers.get('access-control-allow-origin'), '*')
  }
  const responses = await Promise.all(Array.from({ length: 4 }, () => fetch(url)))
  const temperatures = []
  for (const response of responses) {
    assert.equal(response.status, 200)
    temperatures.push((await response.json()).temperature)
  }
  assert.deepEqual(temperatures.sort((a, b) => a - b), [53, 54, 55, 56])
})

test('reports unavailable or invalid sensor readings instead of fabricated temperatures', async t => {
  t.mock.method(console, 'error', () => {})
  for (const readTemperature of [
    async () => { throw new Error('Sensor unavailable') },
    async () => '',
    async () => 'invalid'
  ]) {
    const url = await listen(t, readTemperature)
    const response = await fetch(url)
    assert.equal(response.status, 503)
    const data = await response.json()
    assert.equal(typeof data.error, 'string')
    assert.equal('temperature' in data, false)
  }
})
