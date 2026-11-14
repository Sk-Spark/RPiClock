import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const faces = JSON.parse(await readFile(path.join(projectDir, 'src/clockFaces.json'), 'utf8'))
const faceIds = new Set(faces.map(face => face.id))

export async function createControllerServer({ stateDir }) {
  await mkdir(stateDir, { recursive: true, mode: 0o700 })
  const statePath = path.join(stateDir, 'controller.json')
  let saved
  try {
    saved = JSON.parse(await readFile(statePath, 'utf8'))
    if (saved.face !== null && !faceIds.has(saved.face)) throw new Error('Invalid persisted controller face')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    saved = { face: null }
    await writeFile(statePath, JSON.stringify(saved), { mode: 0o600 })
  }
  let revision = 0
  let displayFace = null
  let lastSeen = 0
  let writes = Promise.resolve()
  const state = () => ({
    face: saved.face, revision, displayFace,
    online: Date.now() - lastSeen < 5000, lastSeen: lastSeen || null
  })
  async function setFace(face) {
    if (face === saved.face) return
    await writeFile(`${statePath}.tmp`, JSON.stringify({ face }), { mode: 0o600 })
    await rename(`${statePath}.tmp`, statePath)
    saved = { face }
    revision += 1
  }
  function serialize(operation) {
    const result = writes.then(operation)
    writes = result.catch(error => console.error('Controller state operation failed:', error))
    return result
  }
  function send(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify(data))
  }
  function reject(res, status, message) {
    console.warn('Controller request rejected:', status, message)
    send(res, status, { error: message })
  }
  async function body(req) {
    if (req.headers['content-type']?.split(';')[0] !== 'application/json') {
      throw Object.assign(new Error('Expected application/json'), { status: 415 })
    }
    const chunks = []
    let length = 0
    for await (const chunk of req) {
      length += chunk.length
      if (length <= 1024) chunks.push(chunk)
    }
    if (length > 1024) throw Object.assign(new Error('Request body too large'), { status: 413 })
    try {
      const data = JSON.parse(Buffer.concat(chunks).toString())
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Expected an object')
      return data
    } catch {
      throw Object.assign(new Error('Invalid JSON body'), { status: 400 })
    }
  }
  const server = http.createServer(async (req, res) => {
    try {
      const authority = new URL(`http://${req.headers.host}`)
      const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)
      const origin = req.headers.origin
      const trustedOrigin = !origin || ['http://127.0.0.1:5173', 'http://localhost:5173'].includes(origin)
      if (!local || !trustedOrigin || !['127.0.0.1', 'localhost', '[::1]'].includes(authority.hostname)) {
        reject(res, 403, 'Controller relay is local to the clock server')
        return
      }
      const route = new URL(req.url, authority).pathname
      const display = route === '/api/display'
      const controller = route === '/api/controller'
      const header = display ? 'x-rpiclock-display' : 'x-rpiclock-controller'
      if ((!display && !controller) || req.headers[header] !== '1') {
        reject(res, 403, 'Use the clock server controller endpoint')
        return
      }
      if (req.method === 'GET') {
        send(res, 200, state())
        return
      }
      if (req.method === 'POST') {
        const data = await body(req)
        if (!faceIds.has(data.face) || (display && !Number.isInteger(data.revision))) {
          reject(res, 400, 'Invalid clock face or revision')
          return
        }
        await serialize(async () => {
          if (display && data.revision !== revision) {
            reject(res, 409, 'A newer face selection is waiting')
            return
          }
          await setFace(data.face)
          if (display) {
            displayFace = data.face
            lastSeen = Date.now()
          }
          send(res, 200, state())
        })
        return
      }
      reject(res, 405, 'Method not allowed')
    } catch (error) {
      console.error('Controller request failed:', error)
      if (!res.headersSent) send(res, error.status || 500, { error: error.status ? error.message : 'Controller server error' })
      else res.destroy()
    }
  })
  server.requestTimeout = 10000
  server.headersTimeout = 10000
  return server
}

export function createMobileControllerServer({ relayPort = 3003, distDir = path.join(projectDir, 'dist') } = {}) {
  const server = http.createServer(async (req, res) => {
    const fail = (status, message) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
      res.end(JSON.stringify({ error: message }))
    }
    try {
      const authority = new URL(`http://${req.headers.host}`)
      const addresses = Object.values(os.networkInterfaces()).flatMap(items => (items || []).map(item => item.address))
      if (!['localhost', '127.0.0.1', os.hostname(), `${os.hostname()}.local`, ...addresses].includes(authority.hostname) ||
          (req.headers.origin && req.headers.origin !== authority.origin)) {
        console.warn('Mobile controller rejected an untrusted host/origin')
        fail(403, 'Untrusted controller request')
        return
      }
      const route = new URL(req.url, authority).pathname
      if (route === '/api/controller' && ['GET', 'POST'].includes(req.method)) {
        const upstream = http.request({
          hostname: '127.0.0.1', port: relayPort, path: route, method: req.method,
          headers: {
            'X-RPiClock-Controller': '1',
            ...(req.headers['content-type'] ? { 'Content-Type': req.headers['content-type'] } : {})
          },
          timeout: 5000
        }, response => {
          res.writeHead(response.statusCode, {
            'Content-Type': 'application/json', 'Cache-Control': 'no-store'
          })
          response.pipe(res)
        })
        upstream.on('timeout', () => upstream.destroy(new Error('Controller relay timed out')))
        upstream.on('error', error => {
          console.error('Mobile controller relay failed:', error)
          if (!res.headersSent) fail(503, 'Clock controller is unavailable')
          else res.destroy()
        })
        req.on('aborted', () => upstream.destroy())
        req.pipe(upstream)
        return
      }
      if (req.method === 'GET' && route === '/') {
        res.writeHead(302, { Location: '/controller' })
        res.end()
        return
      }
      let file
      let mime
      if (req.method === 'GET' && route === '/controller') {
        file = path.join(distDir, 'index.html')
        mime = 'text/html'
      } else if (req.method === 'GET' && route.startsWith('/assets/')) {
        const name = path.basename(route)
        if (route === `/assets/${name}` && /\.(js|css)$/.test(name)) {
          file = path.join(distDir, 'assets', name)
          mime = name.endsWith('.js') ? 'text/javascript' : 'text/css'
        }
      } else if (req.method === 'GET' && route === '/vite.svg') {
        file = path.join(distDir, 'vite.svg')
        mime = 'image/svg+xml'
      }
      if (!file) {
        console.warn('Mobile controller rejected a non-controller route')
        fail(404, 'Only the clock controller is available here')
        return
      }
      try {
        const data = await readFile(file)
        res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' })
        res.end(data)
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
        console.error('Mobile controller asset missing:', file)
        fail(404, 'Controller asset not found; rebuild the project')
      }
    } catch (error) {
      console.error('Mobile controller request failed:', error)
      if (!res.headersSent) fail(500, 'Controller server error')
      else res.destroy()
    }
  })
  server.requestTimeout = 10000
  server.headersTimeout = 10000
  return server
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await createControllerServer({
    stateDir: path.join(os.homedir(), '.local/share/rpiclock/controller')
  })
  server.on('error', error => {
    console.error('Clock controller listener failed:', error)
    process.exit(1)
  })
  server.listen(3003, '127.0.0.1', () => console.log('Clock controller relay listening locally on port 3003'))
  const mobileServers = new Map()
  const updateMobileListeners = () => {
    const addresses = new Set(Object.values(os.networkInterfaces()).flatMap(items =>
      (items || []).filter(item => item.family === 'IPv4' && !item.internal).map(item => item.address)))
    for (const [key, { address, listener }] of mobileServers) {
      if (!addresses.has(address)) { listener.close(); mobileServers.delete(key) }
    }
    for (const address of addresses) {
      for (const port of [5173, 1573]) {
        const key = `${address}:${port}`
        if (mobileServers.has(key)) continue
        const listener = createMobileControllerServer()
        mobileServers.set(key, { address, listener })
        listener.on('error', error => {
          console.error(`Mobile controller could not listen on port ${port}:`, error)
          mobileServers.delete(key)
          listener.close()
        })
        listener.listen(port, address, () => console.log(`Mobile controller: http://${address}:${port}/controller`))
      }
    }
  }
  updateMobileListeners()
  setInterval(updateMobileListeners, 5000).unref()
}
