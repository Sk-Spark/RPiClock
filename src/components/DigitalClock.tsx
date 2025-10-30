import React, { useState, useEffect } from 'react'
import './DigitalClock.css'

interface TimeData {
  hours: string
  minutes: string
  seconds: string
  ampm: string
  date: string
  day: string
}

const DigitalClock: React.FC = () => {
  const [time, setTime] = useState<TimeData>({
    hours: '00',
    minutes: '00',
    seconds: '00',
    ampm: 'AM',
    date: '',
    day: ''
  })

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
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="digital-clock-page">
      <div className="digital-container">
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
      </div>
    </div>
  )
}

export default DigitalClock