import React, { useState, useEffect } from 'react'
import './ModernClock.css'

interface TimeData {
  hours: string
  minutes: string
  seconds: string
  ampm: string
  date: string
  day: string
}

const ModernClock: React.FC = () => {
  const [time, setTime] = useState<TimeData>({
    hours: '00',
    minutes: '00',
    seconds: '00',
    ampm: 'AM',
    date: '',
    day: ''
  })

  const [isSmallDisplay, setIsSmallDisplay] = useState(false)
  const [analogTime, setAnalogTime] = useState({ hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours24 = now.getHours()
      const hours12 = hours24 % 12 || 12
      const minutes = now.getMinutes()
      const seconds = now.getSeconds()
      const ampm = hours24 >= 12 ? 'PM' : 'AM'

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December']

      const day = days[now.getDay()]
      const month = months[now.getMonth()]
      const date = `${month} ${now.getDate()}, ${now.getFullYear()}`

      setTime({
        hours: hours12.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0'),
        ampm,
        date,
        day
      })

      // Set analog time using actual values for proper hand positioning
      setAnalogTime({
        hours: hours12,
        minutes: minutes,
        seconds: seconds
      })


    }

    const checkDisplaySize = () => {
      setIsSmallDisplay(window.innerWidth <= 800 && window.innerHeight <= 480)
    }

    updateTime()
    checkDisplaySize()
    
    const timeInterval = setInterval(updateTime, 1000)
    window.addEventListener('resize', checkDisplaySize)

    return () => {
      clearInterval(timeInterval)
      window.removeEventListener('resize', checkDisplaySize)
    }
  }, [])

  // Calculate rotation for analog clock hands
  // 12 o'clock position is at 0 degrees (pointing up)
  const secondRotation = (analogTime.seconds * 6) - 90 // 6 degrees per second, -90 to start at 12
  const minuteRotation = (analogTime.minutes * 6) + (analogTime.seconds * 0.1) - 90 // minute hand moves smoothly
  const hourRotation = ((analogTime.hours % 12) * 30) + (analogTime.minutes * 0.5) - 90 // hour hand moves smoothly



  return (
    <div className="modern-clock">
      <div className="clock-container">
        {/* Digital Display */}
        <div className="digital-display">
          <div className="time-display">
            <span className="hours">{time.hours}</span>
            <span className="separator">:</span>
            <span className="minutes">{time.minutes}</span>
            <span className="separator">:</span>
            <span className="seconds">{time.seconds}</span>
            <span className="ampm">{time.ampm}</span>
          </div>
          <div className="date-display">
            <div className="day">{time.day}</div>
            <div className="date">{time.date}</div>
          </div>
        </div>

        {/* Analog Clock */}
        <div className="analog-clock">
          <div className="clock-face">
            {/* Hour markers */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="hour-marker"
                style={{
                  transform: isSmallDisplay 
                    ? `rotate(${i * 30}deg) translateY(-85px)`
                    : `rotate(${i * 30}deg) translateY(-140px)`
                }}
              >
                <div className="marker-line"></div>
              </div>
            ))}

            {/* Minute markers */}
            {[...Array(60)].map((_, i) => (
              <div
                key={i}
                className={`minute-marker ${i % 5 === 0 ? 'major' : ''}`}
                style={{
                  transform: isSmallDisplay 
                    ? `rotate(${i * 6}deg) translateY(-87px)`
                    : `rotate(${i * 6}deg) translateY(-145px)`
                }}
              >
                <div className="marker-dot"></div>
              </div>
            ))}

            {/* Clock hands */}
            <div
              className="hand hour-hand"
              style={{ transform: `rotate(${hourRotation}deg)` }}
            ></div>
            <div
              className="hand minute-hand"
              style={{ transform: `rotate(${minuteRotation}deg)` }}
            ></div>
            <div
              className="hand second-hand"
              style={{ transform: `rotate(${secondRotation}deg)` }}
            ></div>

            {/* Center dot */}
            <div className="center-dot"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModernClock