export function getIsoWeek(date: Date) {
  const thursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7))
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1)
  return Math.ceil(((thursday.getTime() - yearStart) / 86400000 + 1) / 7)
}

export function getDayOfYear(date: Date) {
  const calendarDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const yearStart = Date.UTC(date.getFullYear(), 0, 1)
  return (calendarDay - yearStart) / 86400000 + 1
}

export function getLocalDayKey(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getNextMidnight(date: Date) {
  const midnight = new Date(date)
  midnight.setHours(24, 0, 0, 0)
  return midnight
}
