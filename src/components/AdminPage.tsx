import React, { useState, useEffect, useRef } from 'react'
import './AdminPage.css'

interface ImageInfo {
  name: string
  path: string
  size: number
}

const AdminPage: React.FC = () => {
  const [images, setImages] = useState<ImageInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use the same hostname as the page, but port 3002 for the API
  const API_URL = `http://${window.location.hostname}:3002/api/images`

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(API_URL)
      if (!response.ok) throw new Error('Failed to load images')
      const data = await response.json()
      setImages(data.images || [])
      setError(null)
    } catch (err) {
      console.error('Failed to load images:', err)
      setError('Failed to connect to image server. Make sure the API server is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i])
    }

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      showNotification(`Successfully uploaded ${result.uploaded} image(s)`, 'success')
      loadImages()
    } catch (err) {
      console.error('Upload failed:', err)
      showNotification('Failed to upload images', 'error')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const toggleImageSelection = (imageName: string) => {
    const newSelection = new Set(selectedImages)
    if (newSelection.has(imageName)) {
      newSelection.delete(imageName)
    } else {
      newSelection.add(imageName)
    }
    setSelectedImages(newSelection)
  }

  const selectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set())
    } else {
      setSelectedImages(new Set(images.map(img => img.name)))
    }
  }

  const deleteSelected = async () => {
    if (selectedImages.size === 0) return

    try {
      const response = await fetch(`${API_URL}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: Array.from(selectedImages) })
      })

      if (!response.ok) throw new Error('Delete failed')

      const result = await response.json()
      showNotification(`Successfully deleted ${result.deleted} image(s)`, 'success')
      setSelectedImages(new Set())
      setShowDeleteConfirm(false)
      loadImages()
    } catch (err) {
      console.error('Delete failed:', err)
      showNotification('Failed to delete images', 'error')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Header */}
        <header className="admin-header">
          <h1>📷 Image Manager</h1>
          <p className="admin-subtitle">Manage your slideshow images</p>
        </header>

        {/* Notification */}
        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        {/* Action Bar */}
        <div className="action-bar">
          <button 
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '⏳ Uploading...' : '➕ Add Images'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {images.length > 0 && (
            <>
              <button 
                className="btn btn-secondary"
                onClick={selectAll}
              >
                {selectedImages.size === images.length ? '☐ Deselect All' : '☑ Select All'}
              </button>

              {selectedImages.size > 0 && (
                <button 
                  className="btn btn-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  🗑️ Delete ({selectedImages.size})
                </button>
              )}
            </>
          )}

          <button 
            className="btn btn-icon"
            onClick={loadImages}
            title="Refresh"
          >
            🔄
          </button>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <span>Uploading...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button className="btn btn-secondary" onClick={loadImages}>
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading images...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && images.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🖼️</span>
            <h2>No Images Yet</h2>
            <p>Add some images to get started with your slideshow</p>
            <button 
              className="btn btn-primary btn-large"
              onClick={() => fileInputRef.current?.click()}
            >
              ➕ Add Your First Image
            </button>
          </div>
        )}

        {/* Image Grid */}
        {!isLoading && !error && images.length > 0 && (
          <div className="image-grid">
            {images.map((image) => (
              <div 
                key={image.name}
                className={`image-card ${selectedImages.has(image.name) ? 'selected' : ''}`}
                onClick={() => toggleImageSelection(image.name)}
              >
                <div className="image-wrapper">
                  <img src={image.path} alt={image.name} loading="lazy" />
                  <div className="image-overlay">
                    <div className={`checkbox ${selectedImages.has(image.name) ? 'checked' : ''}`}>
                      {selectedImages.has(image.name) ? '✓' : ''}
                    </div>
                  </div>
                </div>
                <div className="image-info">
                  <span className="image-name" title={image.name}>{image.name}</span>
                  <span className="image-size">{formatFileSize(image.size)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Bar */}
        {!isLoading && !error && images.length > 0 && (
          <div className="stats-bar">
            <span>{images.length} image{images.length !== 1 ? 's' : ''} total</span>
            {selectedImages.size > 0 && (
              <span>{selectedImages.size} selected</span>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>🗑️ Delete Images?</h2>
              <p>Are you sure you want to delete {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''}?</p>
              <p className="warning">This action cannot be undone.</p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={deleteSelected}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPage
