import React, { useState, useEffect, useRef } from 'react'
import './ImageSlideshow.css'

const ImageSlideshow: React.FC = () => {
  const [images, setImages] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState<number | null>(null)
  const [, setIsTransitioning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Refs to track current values for interval callbacks
  const currentIndexRef = useRef(0)
  const isTransitioningRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [bgColors, setBgColors] = useState<{ primary: string; secondary: string }>({
    primary: '#1a1a2e',
    secondary: '#0f3460'
  })

  // Settings state with localStorage persistence
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('slideshowSettings')
    const defaults = {
      zoomDuration: 6,      // seconds
      zoomAmount: 1.08,     // scale factor
      slideDuration: 5,     // seconds between slides
      transitionDuration: 1.5, // seconds for crossfade
      shuffle: false,       // randomize order
      transitionEffect: 'fade', // fade, slide, zoom, rotate
      slideDirection: 'random', // left, right, random
      backgroundMode: 'blur'  // gradient, blur, solid
    }
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults
  })

  // Shuffled indices for shuffle mode
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([])
  const shufflePositionRef = useRef(0)
  
  // Random slide direction for slide effect
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')

  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem('slideshowSettings', JSON.stringify(settings))
  }, [settings])

  // Update slide direction immediately when setting changes
  useEffect(() => {
    if (settings.slideDirection === 'left' || settings.slideDirection === 'right') {
      setSlideDirection(settings.slideDirection)
    }
  }, [settings.slideDirection])

  // Slideshow interval in milliseconds (from settings)
  const SLIDESHOW_INTERVAL = settings.slideDuration * 1000

  // Extract dominant colors from an image
  const extractColors = (imageSrc: string): Promise<{ primary: string; secondary: string }> => {
    return new Promise((resolve) => {
      const img = new Image()
      // Only set crossOrigin for external URLs, not local images
      if (imageSrc.startsWith('http')) {
        img.crossOrigin = 'Anonymous'
      }
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve({ primary: '#1a1a2e', secondary: '#0f3460' })
            return
          }

          // Use small size for faster processing
          const sampleSize = 50
          canvas.width = sampleSize
          canvas.height = sampleSize
          ctx.drawImage(img, 0, 0, sampleSize, sampleSize)

          const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize).data
          const colorCounts: { [key: string]: { count: number; r: number; g: number; b: number } } = {}

          // Sample pixels and group similar colors
          for (let i = 0; i < imageData.length; i += 16) { // Skip pixels for speed
            const r = imageData[i]
            const g = imageData[i + 1]
            const b = imageData[i + 2]
            
            // Quantize colors to reduce variations (group similar colors)
            const qr = Math.round(r / 32) * 32
            const qg = Math.round(g / 32) * 32
            const qb = Math.round(b / 32) * 32
            const key = `${qr},${qg},${qb}`

            if (colorCounts[key]) {
              colorCounts[key].count++
              colorCounts[key].r += r
              colorCounts[key].g += g
              colorCounts[key].b += b
            } else {
              colorCounts[key] = { count: 1, r, g, b }
            }
          }

          // Sort colors by frequency
          const sortedColors = Object.values(colorCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5) // Top 5 colors

          if (sortedColors.length >= 2) {
            const primary = sortedColors[0]
            const secondary = sortedColors[1]
            
            // Darken colors slightly for better background
            const darken = (value: number) => Math.max(0, Math.floor((value / primary.count) * 0.7))
            const darken2 = (value: number) => Math.max(0, Math.floor((value / secondary.count) * 0.6))

            resolve({
              primary: `rgb(${darken(primary.r)}, ${darken(primary.g)}, ${darken(primary.b)})`,
              secondary: `rgb(${darken2(secondary.r)}, ${darken2(secondary.g)}, ${darken2(secondary.b)})`
            })
          } else if (sortedColors.length === 1) {
            const primary = sortedColors[0]
            const avg = (v: number) => Math.max(0, Math.floor((v / primary.count) * 0.7))
            const color = `rgb(${avg(primary.r)}, ${avg(primary.g)}, ${avg(primary.b)})`
            resolve({ primary: color, secondary: color })
          } else {
            resolve({ primary: '#1a1a2e', secondary: '#0f3460' })
          }
        } catch (err) {
          console.warn('Color extraction failed:', err)
          resolve({ primary: '#1a1a2e', secondary: '#0f3460' })
        }
      }
      img.onerror = () => {
        resolve({ primary: '#1a1a2e', secondary: '#0f3460' })
      }
      img.src = imageSrc
    })
  }
  // Hide controls after 10 seconds of inactivity
  const HIDE_CONTROLS_DELAY = 5000

  useEffect(() => {
    const loadImages = async () => {
      try {
        // Import all images from the images folder (case-insensitive extensions)
        const imageModules = import.meta.glob('/src/assets/images/*.{jpg,JPG,jpeg,JPEG,png,PNG,gif,GIF,webp,WEBP,svg,SVG}', { eager: true })
        
        const imagePaths = Object.keys(imageModules).map((path) => {
          const module = imageModules[path] as { default: string }
          return module.default
        })

        if (imagePaths.length === 0) {
          setError('No images found in /src/assets/images/')
        } else {
          setImages(imagePaths)
          // Initialize shuffled indices
          const indices = Array.from({ length: imagePaths.length }, (_, i) => i)
          shuffleArray(indices)
          setShuffledIndices(indices)
        }
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to load images:', err)
        setError('Failed to load images')
        setIsLoading(false)
      }
    }

    loadImages()
  }, [])

  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array: number[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  // Reshuffle when shuffle setting changes
  useEffect(() => {
    if (settings.shuffle && images.length > 0) {
      const indices = Array.from({ length: images.length }, (_, i) => i)
      shuffleArray(indices)
      setShuffledIndices(indices)
      shufflePositionRef.current = 0
    }
  }, [settings.shuffle, images.length])

  // Get next index based on shuffle mode
  const getNextImageIndex = (currentIdx: number): number => {
    if (settings.shuffle) {
      shufflePositionRef.current = (shufflePositionRef.current + 1) % shuffledIndices.length
      // Reshuffle when we complete a cycle
      if (shufflePositionRef.current === 0) {
        const newIndices = [...shuffledIndices]
        shuffleArray(newIndices)
        setShuffledIndices(newIndices)
      }
      return shuffledIndices[shufflePositionRef.current]
    }
    return (currentIdx + 1) % images.length
  }

  const getPrevImageIndex = (currentIdx: number): number => {
    if (settings.shuffle) {
      shufflePositionRef.current = (shufflePositionRef.current - 1 + shuffledIndices.length) % shuffledIndices.length
      return shuffledIndices[shufflePositionRef.current]
    }
    return (currentIdx - 1 + images.length) % images.length
  }

  // Use a ref to always have the latest settings value
  const settingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    if (images.length <= 1) return

    const interval = setInterval(() => {
      changeImage(getNextImageIndex)
    }, SLIDESHOW_INTERVAL)

    return () => clearInterval(interval)
  }, [images.length, settings.slideDuration, settings.shuffle, shuffledIndices])

  // Smooth image transition handler
  const changeImage = (getNextIndex: (prev: number) => number) => {
    if (isTransitioningRef.current) return
    
    isTransitioningRef.current = true
    setIsTransitioning(true)
    
    // Set slide direction based on setting (use ref for latest value)
    const currentSettings = settingsRef.current
    if (currentSettings.slideDirection === 'random') {
      setSlideDirection(Math.random() > 0.5 ? 'left' : 'right')
    } else {
      setSlideDirection(currentSettings.slideDirection as 'left' | 'right')
    }
    
    const prevIdx = currentIndexRef.current
    const nextIdx = getNextIndex(prevIdx)
    
    setPreviousIndex(prevIdx)
    setCurrentIndex(nextIdx)
    currentIndexRef.current = nextIdx
    
    // Clear transition state after animation completes (use ref for latest duration)
    const transitionMs = currentSettings.transitionDuration * 1000
    setTimeout(() => {
      setPreviousIndex(null)
      setIsTransitioning(false)
      isTransitioningRef.current = false
    }, transitionMs)
  }

  // Extract colors when current image changes
  useEffect(() => {
    if (images.length > 0 && images[currentIndex]) {
      extractColors(images[currentIndex]).then(setBgColors)
    }
  }, [currentIndex, images])

  // Auto-hide controls after 10 seconds of inactivity
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>

    const resetTimer = () => {
      setShowControls(true)
      clearTimeout(hideTimer)
      hideTimer = setTimeout(() => {
        setShowControls(false)
      }, HIDE_CONTROLS_DELAY)
    }

    // Initial timer
    resetTimer()

    // Show controls on any interaction
    const handleInteraction = () => {
      resetTimer()
    }

    window.addEventListener('mousemove', handleInteraction)
    window.addEventListener('mousedown', handleInteraction)
    window.addEventListener('touchstart', handleInteraction)
    window.addEventListener('keydown', handleInteraction)

    return () => {
      clearTimeout(hideTimer)
      window.removeEventListener('mousemove', handleInteraction)
      window.removeEventListener('mousedown', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }
  }, [])

  const goToNext = () => {
    changeImage(getNextImageIndex)
  }

  const goToPrevious = () => {
    changeImage(getPrevImageIndex)
  }

  if (isLoading) {
    return (
      <div className="slideshow-page">
        <div className="slideshow-container">
          <div className="slideshow-loading">Loading images...</div>
        </div>
      </div>
    )
  }

  if (error || images.length === 0) {
    return (
      <div className="slideshow-page">
        <div className="slideshow-container">
          <div className="slideshow-error">
            <div className="error-icon">🖼️</div>
            <div className="error-message">{error || 'No images found'}</div>
            <div className="error-hint">
              Add images to <code>/src/assets/images/</code> folder
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`slideshow-page bg-mode-${settings.backgroundMode}`}
      style={{
        '--bg-primary': bgColors.primary,
        '--bg-secondary': bgColors.secondary
      } as React.CSSProperties}
    >
      {/* Blurred Background Layer */}
      {settings.backgroundMode === 'blur' && images.length > 0 && (
        <div className="slideshow-blur-bg">
          {images.map((imageSrc, index) => (
            <img
              key={`blur-${index}`}
              src={imageSrc}
              alt=""
              className={`blur-bg-image ${
                index === currentIndex ? 'blur-bg-active' : 
                index === previousIndex ? 'blur-bg-prev' : 
                'blur-bg-hidden'
              }`}
              style={{
                '--transition-duration': `${settings.transitionDuration}s`
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      <div className="slideshow-container">
        {/* Image Display with Crossfade */}
        <div className="slideshow-image-wrapper">
          {images.map((imageSrc, index) => (
            <img
              key={index}
              src={imageSrc}
              alt={`Slide ${index + 1}`}
              className={`slideshow-image transition-${settings.transitionEffect} slide-${slideDirection} ${
                index === currentIndex ? 'slideshow-image-active' : 
                index === previousIndex ? 'slideshow-image-prev' : 
                'slideshow-image-hidden'
              }`}
              style={{
                '--zoom-duration': `${settings.zoomDuration}s`,
                '--zoom-amount': settings.zoomAmount,
                '--transition-duration': `${settings.transitionDuration}s`
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Settings Button */}
        {showControls && (
          <button
            className="settings-button"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Settings"
          >
            ⚙️
          </button>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="settings-panel">
            <div className="settings-header">
              <h3>Slideshow Settings</h3>
              <button className="settings-close" onClick={() => setShowSettings(false)}>×</button>
            </div>
            
            <div className="settings-group">
              <label>
                <span>Zoom Duration: {settings.zoomDuration}s</span>
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="0.5"
                  value={settings.zoomDuration}
                  onChange={(e) => setSettings({...settings, zoomDuration: parseFloat(e.target.value)})}
                />
              </label>
            </div>

            <div className="settings-group">
              <label>
                <span>Zoom Amount: {Math.round((settings.zoomAmount - 1) * 100)}%</span>
                <input
                  type="range"
                  min="1"
                  max="1.25"
                  step="0.01"
                  value={settings.zoomAmount}
                  onChange={(e) => setSettings({...settings, zoomAmount: parseFloat(e.target.value)})}
                />
              </label>
            </div>

            <div className="settings-group">
              <label>
                <span>Slide Duration: {settings.slideDuration}s</span>
                <input
                  type="range"
                  min="2"
                  max="30"
                  step="1"
                  value={settings.slideDuration}
                  onChange={(e) => setSettings({...settings, slideDuration: parseFloat(e.target.value)})}
                />
              </label>
            </div>

            <div className="settings-group">
              <label>
                <span>Transition Speed: {settings.transitionDuration}s</span>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={settings.transitionDuration}
                  onChange={(e) => setSettings({...settings, transitionDuration: parseFloat(e.target.value)})}
                />
              </label>
            </div>

            <div className="settings-group">
              <label>
                <span>Transition Effect</span>
                <select
                  value={settings.transitionEffect}
                  onChange={(e) => setSettings({...settings, transitionEffect: e.target.value})}
                  className="settings-select"
                >
                  <option value="fade">Fade</option>
                  <option value="slide">Slide</option>
                  <option value="zoom">Zoom</option>
                  <option value="rotate">Rotate</option>
                </select>
              </label>
            </div>

            {settings.transitionEffect === 'slide' && (
              <div className="settings-group">
                <label>
                  <span>Slide Direction</span>
                  <select
                    value={settings.slideDirection}
                    onChange={(e) => setSettings({...settings, slideDirection: e.target.value})}
                    className="settings-select"
                  >
                    <option value="right">Right</option>
                    <option value="left">Left</option>
                    <option value="random">Random</option>
                  </select>
                </label>
              </div>
            )}

            <div className="settings-group">
              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={settings.shuffle}
                  onChange={(e) => setSettings({...settings, shuffle: e.target.checked})}
                />
                <span>Shuffle Mode</span>
              </label>
            </div>

            <div className="settings-group">
              <label>
                <span>Background Style</span>
                <select
                  value={settings.backgroundMode}
                  onChange={(e) => setSettings({...settings, backgroundMode: e.target.value})}
                  className="settings-select"
                >
                  <option value="blur">Blurred Image</option>
                  <option value="gradient">Color Gradient</option>
                  <option value="solid">Solid Dark</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Navigation Controls - Hidden after 10 seconds */}
        {images.length > 1 && showControls && (
          <div className={`slideshow-controls ${showControls ? 'visible' : 'hidden'}`}>
            <button 
              className="slideshow-nav slideshow-prev" 
              onClick={goToPrevious}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button 
              className="slideshow-nav slideshow-next" 
              onClick={goToNext}
              aria-label="Next image"
            >
              ›
            </button>

            {/* Dots Indicator */}
            <div className="slideshow-dots">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`slideshow-dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Image Counter */}
            <div className="slideshow-counter">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageSlideshow
