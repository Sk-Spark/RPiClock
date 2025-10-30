import React, { useState, useEffect } from 'react'
import './AnalogClock.css'

interface TimeData {
  hours: string
  minutes: string
  seconds: string
  ampm: string
  date: string
  day: string
}

const AnalogClock: React.FC = () => {
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
      setIsSmallDisplay(window.innerWidth <= 800 || window.innerHeight <= 480)
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
  const secondRotation = (analogTime.seconds * 6) // 6 degrees per second
  const minuteRotation = (analogTime.minutes * 6) + (analogTime.seconds * 0.1) // minute hand moves smoothly
  const hourRotation = ((analogTime.hours % 12) * 30) + (analogTime.minutes * 0.5) // hour hand moves smoothly

  return (
    <div className="analog-clock-page">
      <div className="analog-container-800x480">
        {/* Date Display - Left Column */}
        <div className="date-info-left">
          <div className="day">{time.day}</div>
          <div className="date">{time.date}</div>
        </div>

        {/* Clock Column - Right Side */}
        <div className="clock-column-right">
          {/* Analog Clock */}
          <div className="analog-clock-center">
            <div className="clock-face">
            {/* Hour markers */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="hour-marker"
                style={{
                  transform: isSmallDisplay 
                    ? `rotate(${i * 30}deg) translateY(-115px)`
                    : `rotate(${i * 30}deg) translateY(-180px)`
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
                    ? `rotate(${i * 6}deg) translateY(-117px)`
                    : `rotate(${i * 6}deg) translateY(-185px)`
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

          {/* Digital Time Display */}
          <div className="digital-time-right">
            <div className="digital-time-large">
              {time.hours}:{time.minutes}:{time.seconds}
            </div>
            <div className="digital-ampm-large">{time.ampm}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalogClock