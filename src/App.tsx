import { useState } from 'react'
import ImageSlideshow from './components/ImageSlideshow'
import DigitalClock from './components/DigitalClock'
import AnalogClock from './components/AnalogClock'
import AdminQRCode from './components/AdminQRCode'
import './App.css'

// Define page configuration
interface PageConfig {
  id: string
  name: string
  component: React.ComponentType
}

const pages: PageConfig[] = [
  { id: 'slideshow', name: 'Image Slideshow', component: ImageSlideshow },
  { id: 'digital', name: 'Digital Clock', component: DigitalClock },
  { id: 'analog', name: 'Analog Clock', component: AnalogClock },
  // Add more pages here easily:
  // { id: 'modern', name: 'Modern Clock', component: ModernClock },
  // { id: 'world', name: 'World Clock', component: WorldClock },
]

function App() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  
  const currentPage = pages[currentPageIndex]

  const handleNavigation = () => {
    setCurrentPageIndex((prevIndex) => (prevIndex + 1) % pages.length)
  }

  const isLastPage = currentPageIndex === pages.length - 1

  return (
    <div className="app">
      {/* Render current page component dynamically */}
      <currentPage.component />
      
      {/* QR Code for Admin access */}
      <AdminQRCode />
      
      {/* Navigation area - cycles through all pages */}
      <div 
        className={`nav-area ${currentPageIndex === 0 ? 'nav-right' : 'nav-left'}`}
        onClick={handleNavigation}
        title={`Switch to ${pages[(currentPageIndex + 1) % pages.length].name}`}
      >
        <div className="nav-indicator">
          {isLastPage ? '←' : '→'}
        </div>
      </div>
    </div>
  )
}

export default App
