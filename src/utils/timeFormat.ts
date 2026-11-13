export type TimeFormat = '12' | '24'

export interface ClockFaceProps {
  timeFormat?: TimeFormat
}

export function formatClockHours(hours24: number, timeFormat: TimeFormat) {
  if (!Number.isInteger(hours24) || hours24 < 0 || hours24 > 23) {
    throw new RangeError(`Invalid clock hour: ${hours24}`)
  }

  return {
    hours: (timeFormat === '12' ? hours24 % 12 || 12 : hours24).toString().padStart(2, '0'),
    ampm: timeFormat === '12' ? hours24 >= 12 ? 'PM' : 'AM' : ''
  }
}

export function getClockHandAngles(time: { hours: number; minutes: number; seconds: number }) {
  return {
    hourRotation: time.hours % 12 * 30 + time.minutes * 0.5,
    minuteRotation: time.minutes * 6 + time.seconds * 0.1,
    secondRotation: time.seconds * 6
  }
}
