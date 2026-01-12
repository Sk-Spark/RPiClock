#!/usr/bin/env node

/**
 * Image Management API Server
 * Handles image upload, deletion, and listing for the slideshow admin panel
 */

import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = 3002
const IMAGES_DIR = path.join(__dirname, '..', 'src', 'assets', 'images')

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true })
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

// Parse multipart form data (simple implementation)
function parseMultipart(buffer, boundary) {
  const files = []
  const parts = buffer.toString('binary').split('--' + boundary)
  
  for (const part of parts) {
    if (part.includes('filename="')) {
      const filenameMatch = part.match(/filename="([^"]+)"/)
      if (filenameMatch) {
        const filename = filenameMatch[1]
        const contentTypeMatch = part.match(/Content-Type: ([^\r\n]+)/)
        
        // Find the start of file content (after double CRLF)
        const headerEnd = part.indexOf('\r\n\r\n')
        if (headerEnd !== -1) {
          let content = part.slice(headerEnd + 4)
          // Remove trailing boundary markers
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
        return {
          name: file,
          path: `/src/assets/images/${file}`,
          size: stats.size
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (err) {
    console.error('Error reading images directory:', err)
    return []
  }
}

// Delete images
function deleteImages(imageNames) {
  let deleted = 0
  
  for (const name of imageNames) {
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
  
  return deleted
}

// Save uploaded files
function saveFiles(files) {
  let uploaded = 0
  
  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file.filename)
    try {
      fs.writeFileSync(filePath, file.content)
      uploaded++
      console.log(`Uploaded: ${file.filename}`)
    } catch (err) {
      console.error(`Error saving ${file.filename}:`, err)
    }
  }
  
  return uploaded
}

// Request handler
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders)
    res.end()
    return
  }

  // GET /api/images - List images
  if (req.method === 'GET' && url.pathname === '/api/images') {
    const images = getImages()
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ images }))
    return
  }

  // POST /api/images/upload - Upload images
  if (req.method === 'POST' && url.pathname === '/api/images/upload') {
    const contentType = req.headers['content-type'] || ''
    const boundaryMatch = contentType.match(/boundary=(.+)/)
    
    if (!boundaryMatch) {
      res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid content type' }))
      return
    }

    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => {
      const buffer = Buffer.concat(chunks)
      const files = parseMultipart(buffer, boundaryMatch[1])
      const uploaded = saveFiles(files)
      
      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ uploaded, total: files.length }))
    })
    return
  }

  // POST /api/images/delete - Delete images
  if (req.method === 'POST' && url.pathname === '/api/images/delete') {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        const { images } = JSON.parse(body)
        const deleted = deleteImages(images || [])
        
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ deleted }))
      } catch (err) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid request body' }))
      }
    })
    return
  }

  // 404 for unknown routes
  res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

// Listen on all interfaces (0.0.0.0) to allow access from other devices
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🖼️  Image API Server running at http://0.0.0.0:${PORT}`)
  console.log(`📁 Images directory: ${IMAGES_DIR}`)
})
