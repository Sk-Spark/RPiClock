import { useState } from 'react'
import DigitalClock from './components/DigitalClock'
import AnalogClock from './components/AnalogClock'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'digital' | 'analog'>('digital')

  const handleRightClick = () => {
    setCurrentPage(currentPage === 'digital' ? 'analog' : 'digital')
  }

  return (
    <div className="app">
      {currentPage === 'digital' && <DigitalClock />}
      {currentPage === 'analog' && <AnalogClock />}
      
      {/* Navigation area - position changes based on current page */}
      <div 
        className={`nav-area ${currentPage === 'digital' ? 'nav-right' : 'nav-left'}`}
        onClick={handleRightClick}
        title={currentPage === 'digital' ? 'Switch to Analog Clock' : 'Switch to Digital Clock'}
      >
        <div className="nav-indicator">
          {currentPage === 'digital' ? '→' : '←'}
        </div>
      </div>
    </div>
  )
}

export default App
