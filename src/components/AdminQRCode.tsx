import React, { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import './AdminQRCode.css'

const AdminQRCode: React.FC = () => {
  const [showModal, setShowModal] = useState(false)
  const [adminUrl, setAdminUrl] = useState('')

  useEffect(() => {
    // Fetch the network info from the server
    fetch('/api/network-info')
      .then(res => res.json())
      .then(data => {
        const protocol = window.location.protocol
        const port = window.location.port
        // Use IP address, fallback to hostname.local
        const hostname = data.ip || `${data.hostname}.local`
        const url = `${protocol}//${hostname}${port ? ':' + port : ''}/admin`
        setAdminUrl(url)
      })
      .catch(() => {
        // Fallback to current location
        const protocol = window.location.protocol
        const hostname = window.location.hostname
        const port = window.location.port
        const url = `${protocol}//${hostname}${port ? ':' + port : ''}/admin`
        setAdminUrl(url)
      })
  }, [])

  return (
    <>
      {/* Small icon button */}
      <button 
        className="qr-trigger"
        onClick={() => setShowModal(true)}
        title="Open Admin on Mobile"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          {/* QR code pattern */}
          <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5z"/>
          {/* QR code dots */}
          <rect x="6" y="6" width="2" height="2"/>
          <rect x="16" y="6" width="2" height="2"/>
          <rect x="6" y="16" width="2" height="2"/>
          <rect x="14" y="14" width="2" height="2"/>
          <rect x="17" y="14" width="2" height="2"/>
          <rect x="14" y="17" width="2" height="2"/>
          <rect x="17" y="17" width="4" height="4"/>
        </svg>
      </button>

      {/* Modal with QR Code */}
      {showModal && (
        <div className="qr-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="qr-modal" onClick={e => e.stopPropagation()}>
            <button className="qr-close" onClick={() => setShowModal(false)}>×</button>
            <h2>Scan to Open Admin</h2>
            <div className="qr-code-container">
              <QRCodeSVG 
                value={adminUrl}
                size={200}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            <p className="qr-url">{adminUrl}</p>
            <p className="qr-hint">Scan with your phone camera</p>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminQRCode
