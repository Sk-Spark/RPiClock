import assert from 'node:assert/strict'
import http from 'node:http'
import { once } from 'node:events'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { createControllerServer, createMobileControllerServer } from './controller-server.js'

async function setup(t, stateDir) {
  const dir = stateDir || await mkdtemp(join(tmpdir(), 'rpiclock-controller-test-'))
  if (!stateDir) t.after(() => rm(dir, { recursive: true, force: true }))
  const server = await createControllerServer({ stateDir: dir })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise((resolve, reject) => {
    server.closeAllConnections()
    server.close(error => error ? reject(error) : resolve())
  }))
  const url = `http://127.0.0.1:${server.address().port}`
  const call = (route, data, headers = {}) => fetch(url + route, {
    method: data ? 'POST' : 'GET',
    headers: { ...(data ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: data ? JSON.stringify(data) : undefined
  })
  return {
    dir, server, call, url,
    controller: { 'X-RPiClock-Controller': '1' },
    display: { 'X-RPiClock-Display': '1' }
  }
}

test('controller switches the LCD and stale acknowledgments cannot undo a newer selection', async t => {
  const { call, controller, display, dir } = await setup(t)
  const initial = await call('/api/display', null, display).then(r => r.json())
  const selected = await call('/api/controller', { face: 'nixie-clock' }, controller).then(r => r.json())
  assert.equal(selected.face, 'nixie-clock')
  assert.equal((await call('/api/display', { face: 'digital', revision: initial.revision }, display)).status, 409)
  const acknowledged = await call('/api/display', { face: 'nixie-clock', revision: selected.revision }, display).then(r => r.json())
  assert.equal(acknowledged.displayFace, 'nixie-clock')
  assert.equal(acknowledged.online, true)
  const local = await call('/api/display', { face: 'analog', revision: acknowledged.revision }, display).then(r => r.json())
  assert.equal(local.face, 'analog')
  assert.equal(JSON.parse(await readFile(join(dir, 'controller.json'), 'utf8')).face, 'analog')
  const restarted = await setup(t, dir)
  assert.equal((await restarted.call('/api/display', null, restarted.display).then(r => r.json())).face, 'analog')
})

test('rejects invalid faces, untrusted requests, and non-controller endpoints', async t => {
  const { call, controller, display, url } = await setup(t)
  assert.equal((await call('/api/controller')).status, 403)
  assert.equal((await call('/api/controller', { face: 'missing' }, controller)).status, 400)
  assert.equal((await call('/api/controller', null, { ...controller, Origin: 'http://untrusted.invalid' })).status, 403)
  assert.equal((await call('/api/display', null, { ...display, Origin: 'http://untrusted.invalid' })).status, 403)
  const badHostStatus = await new Promise((resolve, reject) => {
    http.get(`${url}/api/controller`, { headers: { ...controller, Host: 'untrusted.invalid' } }, response => {
      response.resume()
      resolve(response.statusCode)
    }).on('error', reject)
  })
  assert.equal(badHostStatus, 403)
  assert.equal((await call('/api/images/upload', { image: 'test' }, controller)).status, 403)
})

test('serializes competing face changes without losing persistent state', async t => {
  const { call, controller, display } = await setup(t)
  const changes = await Promise.all(['retro-lcd', 'flip-clock', 'teal-analog'].map(face => call('/api/controller', { face }, controller)))
  for (const response of changes) assert.equal(response.status, 200)
  const state = await call('/api/display', null, display).then(r => r.json())
  assert.equal(state.revision, 3)
  assert.ok(['retro-lcd', 'flip-clock', 'teal-analog'].includes(state.face))
})

test('mobile controller forwards face commands but blocks private APIs and untrusted origins', async t => {
  const { server: relay } = await setup(t)
  const mobile = createMobileControllerServer({ relayPort: relay.address().port })
  mobile.listen(0, '127.0.0.1')
  await once(mobile, 'listening')
  t.after(() => new Promise((resolve, reject) => {
    mobile.closeAllConnections()
    mobile.close(error => error ? reject(error) : resolve())
  }))
  const url = `http://127.0.0.1:${mobile.address().port}`
  const selected = await fetch(`${url}/api/controller`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: url },
    body: JSON.stringify({ face: 'flip-clock' })
  }).then(r => r.json())
  assert.equal(selected.face, 'flip-clock')
  assert.equal((await fetch(`${url}/api/controller`, { headers: { Origin: 'http://untrusted.invalid' } })).status, 403)
  assert.equal((await fetch(`${url}/api/display`)).status, 404)
  assert.equal((await fetch(`${url}/api/images`)).status, 404)
  assert.equal((await fetch(`${url}/admin`)).status, 404)
  assert.equal((await fetch(`${url}/.env`)).status, 404)
})
