import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const IMAGES_DIR = path.join(__dirname, 'src', 'assets', 'images')

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true })
}

// Parse multipart form data
function parseMultipart(buffer: Buffer, boundary: string) {
  const files: { filename: string; content: Buffer }[] = []
  const parts = buffer.toString('binary').split('--' + boundary)
  
  for (const part of parts) {
    if (part.includes('filename="')) {
      const filenameMatch = part.match(/filename="([^"]+)"/)
      if (filenameMatch) {
        const filename = filenameMatch[1]
        const headerEnd = part.indexOf('\r\n\r\n')
        if (headerEnd !== -1) {
          let content = part.slice(headerEnd + 4)
          content = content.replace(/\r\n--?$/, '')
          files.push({
            filename: filename.replace(/[^a-zA-Z0-9._-]/g, '_'),
            content: Buffer.from(content, 'binary')
          })
        }
      }
    }
  }
  return files
}

// Get list of images
function getImages() {
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  try {
    const files = fs.readdirSync(IMAGES_DIR)
    return files
      .filter(file => {
        const ext = path.extname(file).toLowerCase()
        return supportedExtensions.includes(ext) && !file.startsWith('.')
      })
      .map(file => {
        const filePath = path.join(IMAGES_DIR, file)
        const stats = fs.statSync(filePath)
        return { name: file, path: `/src/assets/images/${file}`, size: stats.size }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: ['rpiclock.local', 'localhost', '127.0.0.1'],
  },
  plugins: [
    react(),
    {
      name: 'image-api',
      configureServer(server) {
        // GET /api/network-info - Get network IP and hostname
        server.middlewares.use('/api/network-info', (req, res, next) => {
          if (req.method === 'GET') {
            const hostname = os.hostname()
            const networkInterfaces = os.networkInterfaces()
            let ip = ''
            
            // Find the first non-internal IPv4 address
            for (const name of Object.keys(networkInterfaces)) {
              for (const iface of networkInterfaces[name] || []) {
                if (iface.family === 'IPv4' && !iface.internal) {
                  ip = iface.address
                  break
                }
              }
              if (ip) break
            }
            
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ hostname, ip }))
            return
          }
          next()
        })

        // GET /api/images - List images
        server.middlewares.use('/api/images', (req, res, next) => {
          if (req.method === 'GET' && req.url === '' || req.url === '/') {
            const images = getImages()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ images }))
            return
          }
          next()
        })

        // POST /api/images/upload - Upload images
        server.middlewares.use('/api/images/upload', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end(JSON.stringify({ error: 'Method not allowed' }))
            return
          }

          const contentType = req.headers['content-type'] || ''
          const boundaryMatch = contentType.match(/boundary=(.+)/)
          
          if (!boundaryMatch) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Invalid content type' }))
            return
          }

          const chunks: Buffer[] = []
          req.on('data', (chunk: Buffer) => chunks.push(chunk))
          req.on('end', () => {
            const buffer = Buffer.concat(chunks)
            const files = parseMultipart(buffer, boundaryMatch[1])
            
            let uploaded = 0
            for (const file of files) {
              try {
                fs.writeFileSync(path.join(IMAGES_DIR, file.filename), file.content)
                uploaded++
                console.log(`Uploaded: ${file.filename}`)
              } catch (err) {
                console.error(`Error saving ${file.filename}:`, err)
              }
            }
            
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ uploaded, total: files.length }))
          })
        })

        // POST /api/images/delete - Delete images
        server.middlewares.use('/api/images/delete', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end(JSON.stringify({ error: 'Method not allowed' }))
            return
          }

          let body = ''
          req.on('data', (chunk: string) => body += chunk)
          req.on('end', () => {
            try {
              const { images } = JSON.parse(body)
              let deleted = 0
              
              for (const name of images || []) {
                const filePath = path.join(IMAGES_DIR, name)
                try {
                  if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath)
                    deleted++
                    console.log(`Deleted: ${name}`)
                  }
                } catch (err) {
                  console.error(`Error deleting ${name}:`, err)
                }
              }
              
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ deleted }))
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Invalid request body' }))
            }
          })
        })
      }
    }
  ],
})
