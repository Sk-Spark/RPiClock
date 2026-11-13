import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

let vite
let cacheDir
let SevenSegmentDigit
let RetroClockFace
let NeonClockFace
let OrbitDigitalFace
let TealAnalogFace
let App
let formatClockHours
let getDayOfYear
let getNextMidnight

before(async () => {
  cacheDir = await mkdtemp(join(tmpdir(), 'rpiclock-face-tests-'))
  vite = await createServer({
    configFile: false,
    cacheDir,
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [react()],
    server: { middlewareMode: true, hmr: false },
    appType: 'custom'
  })
  SevenSegmentDigit = (await vite.ssrLoadModule('/src/components/SevenSegmentDigit.tsx')).default
  RetroClockFace = (await vite.ssrLoadModule('/src/components/RetroClockFace.tsx')).default
  NeonClockFace = (await vite.ssrLoadModule('/src/components/NeonClockFace.tsx')).default
  OrbitDigitalFace = (await vite.ssrLoadModule('/src/components/OrbitDigitalFace.tsx')).default
  TealAnalogFace = (await vite.ssrLoadModule('/src/components/TealAnalogFace.tsx')).default
  App = (await vite.ssrLoadModule('/src/App.tsx')).default
  formatClockHours = (await vite.ssrLoadModule('/src/utils/timeFormat.ts')).formatClockHours
  getDayOfYear = (await vite.ssrLoadModule('/src/utils/calendar.ts')).getDayOfYear
  getNextMidnight = (await vite.ssrLoadModule('/src/utils/calendar.ts')).getNextMidnight
})

after(async () => {
  if (vite) await vite.close()
  if (cacheDir) await rm(cacheDir, { recursive: true, force: true })
})

test('renders distinct seven-segment shapes for zero, one, eight, and nine', () => {
  for (const [digit, expected] of [
    ['0', 'abcdef'],
    ['1', 'bc'],
    ['8', 'abcdefg'],
    ['9', 'abcdfg']
  ]) {
    const markup = renderToStaticMarkup(createElement(SevenSegmentDigit, { digit }))
    const active = [...markup.matchAll(/data-segment="([a-g])" class="retro-segment retro-segment-on"/g)]
      .map(match => match[1]).join('')
    assert.equal(active, expected)
    assert.equal((markup.match(/<polygon /g) || []).length, 7)
  }
  assert.throws(() => renderToStaticMarkup(createElement(SevenSegmentDigit, { digit: 'x' })), RangeError)
})

test('composes live-style time, seconds, date, and unavailable system readings without invented data', () => {
  const markup = renderToStaticMarkup(createElement(RetroClockFace, {
    time: {
      timestamp: Date.parse('2026-11-14T09:41:08+05:30'),
      hours: '09', hours24: '09', minutes: '41', seconds: '08', ampm: 'AM',
      date: 'November 14, 2026', day: 'Saturday',
      fullDate: 'Saturday 14 November 2026', shortDate: 'Sat 14 Nov'
    },
    systemData: {
      cpuTemp: '--°C',
      weather: { temp: '--°C', condition: 'Service unavailable', icon: '' },
      location: { city: 'Unknown', country: 'Unknown' }
    }
  }))
  assert.match(markup, /role="timer" aria-live="off" aria-label="09:41:08 AM"/)
  assert.equal((markup.match(/class="retro-digit"/g) || []).length, 6)
  assert.match(markup, /Saturday 14 November 2026/)
  assert.match(markup, /Service unavailable/)
  assert.match(markup, /CPU --°C/)
  assert.doesNotMatch(markup, /Clear|48°C/)
})

test('selects bookmarked faces while retaining the original default and correct previous/next targets', t => {
  t.mock.method(console, 'warn', () => {})
  for (const [url, faceClass] of [
    ['/', 'digital-clock-page'],
    ['/?face=retro-lcd', 'retro-clock-face'],
    ['/?face=analog', 'analog-clock-page'],
    ['/?face=neon-red', 'neon-clock-face'],
    ['/?face=orbit-digital', 'orbit-digital-face'],
    ['/?face=teal-analog', 'teal-analog-face'],
    ['/?face=unknown', 'digital-clock-page']
  ]) {
    const markup = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [url] }, createElement(App)))
    assert.match(markup, new RegExp(`class="${faceClass}"`))
    assert.equal((markup.match(/aria-label="(?:Previous|Next) face:/g) || []).length, 2)
    assert.match(markup, /aria-label="Clock settings"/)
    if (url.includes('retro-lcd')) {
      assert.match(markup, /aria-label="Previous face: Analog Clock"/)
      assert.match(markup, /aria-label="Next face: Neon Red"/)
    }
    if (url.includes('neon-red')) {
      assert.match(markup, /aria-label="Previous face: Retro LCD"/)
      assert.match(markup, /aria-label="Next face: Orbit Digital"/)
    }
    if (url.includes('orbit-digital')) {
      assert.match(markup, /aria-label="Previous face: Neon Red"/)
      assert.match(markup, /aria-label="Next face: Teal Analog"/)
    }
    if (url.includes('teal-analog')) {
      assert.match(markup, /aria-label="Previous face: Orbit Digital"/)
      assert.match(markup, /aria-label="Next face: Digital Clock"/)
    }
  }
})

test('renders the minimal neon face in 24-hour format without AM/PM or system widgets', () => {
  const markup = renderToStaticMarkup(createElement(NeonClockFace, {
    time: { hours: '23', minutes: '42', ampm: '', shortDate: 'Fri 13 Nov' }
  }))
  assert.match(markup, /role="timer" aria-live="off" aria-label="23:42"/)
  assert.match(markup, /Fri 13 Nov/)
  assert.equal((markup.match(/<path /g) || []).length, 4)
  assert.equal((markup.match(/<circle /g) || []).length, 2)
  assert.doesNotMatch(markup, /CPU|weather|AM|PM/)
})

test('derives the orbit greeting, seconds arc, ISO week, and day progress from live time data', () => {
  const timestamp = new Date(2026, 10, 13, 10, 14, 43).getTime()
  const markup = renderToStaticMarkup(createElement(OrbitDigitalFace, { time: { timestamp } }))
  assert.match(markup, /Good morning/)
  assert.match(markup, /aria-label="10:14"/)
  assert.match(markup, /Friday, 13 November 2026/)
  assert.match(markup, /aria-label="43 seconds"/)
  assert.match(markup, /class="orbit-ring-progress"/)
  assert.match(markup, /Week 46/)
  assert.match(markup, /<progress value="36883" max="86400" aria-label="Day progress"/)
  assert.match(markup, /43%/)
})

test('handles ISO week-year boundaries and a zero-seconds midnight reset', () => {
  for (const [timestamp, week] of [
    [new Date(2021, 0, 1, 0, 0, 0).getTime(), 53],
    [new Date(2021, 0, 4, 0, 0, 0).getTime(), 1]
  ]) {
    const markup = renderToStaticMarkup(createElement(OrbitDigitalFace, { time: { timestamp } }))
    assert.match(markup, new RegExp(`Week ${week}<`))
    assert.match(markup, /aria-label="00:00"/)
    assert.match(markup, /<progress value="0"/)
    assert.doesNotMatch(markup, /class="orbit-ring-progress"/)
  }
  for (const [hour, greeting] of [[12, 'Good afternoon'], [18, 'Good evening']]) {
    const markup = renderToStaticMarkup(createElement(OrbitDigitalFace, {
      time: { timestamp: new Date(2026, 10, 13, hour).getTime() }
    }))
    assert.match(markup, new RegExp(greeting))
  }
})

test('formats midnight, noon, and afternoon consistently in 12-hour and 24-hour modes', () => {
  for (const [hour, hours12, ampm] of [[0, '12', 'AM'], [12, '12', 'PM'], [17, '05', 'PM'], [23, '11', 'PM']]) {
    assert.deepEqual(formatClockHours(hour, '12'), { hours: hours12, ampm })
    assert.deepEqual(formatClockHours(hour, '24'), { hours: String(hour).padStart(2, '0'), ampm: '' })
  }
})

test('neon and orbit honour 12-hour selection without changing orbit day progress', () => {
  const neon = renderToStaticMarkup(createElement(NeonClockFace, {
    time: { ...formatClockHours(17, '12'), minutes: '42', shortDate: 'Fri 13 Nov' }
  }))
  assert.match(neon, /aria-label="05:42 PM"/)
  assert.match(neon, /class="neon-clock-ampm">PM</)
  const orbit = renderToStaticMarkup(createElement(OrbitDigitalFace, {
    time: { timestamp: new Date(2026, 10, 13, 17, 42).getTime() },
    timeFormat: '12'
  }))
  assert.match(orbit, /aria-label="05:42 PM"/)
  assert.match(orbit, /Good afternoon/)
  assert.match(orbit, /<progress value="63720"/)
})

test('teal face shows local calendar values and genuine UTC in both selected formats', t => {
  const previousTimezone = process.env.TZ
  process.env.TZ = 'Asia/Kolkata'
  t.after(() => {
    if (previousTimezone === undefined) delete process.env.TZ
    else process.env.TZ = previousTimezone
  })
  const time = { timestamp: Date.parse('2026-11-13T17:14:43+05:30') }
  for (const [timeFormat, localLabel, utcLabel] of [
    ['24', '17:14', '11:44'],
    ['12', '05:14 PM', '11:44 AM']
  ]) {
    const markup = renderToStaticMarkup(createElement(TealAnalogFace, { time, timeFormat }))
    assert.match(markup, new RegExp(`role="timer" aria-live="off" aria-label="${localLabel}"`))
    assert.match(markup, new RegExp(`aria-label="UTC ${utcLabel}"`))
    assert.match(markup, /13 November 2026/)
    assert.match(markup, /class="teal-card-value">46</)
    assert.match(markup, /class="teal-card-value">317</)
    assert.match(markup, /class="teal-hour-hand".*transform="rotate\(157 160 160\)"/)
    assert.equal((markup.match(/class="teal-dial-number"/g) || []).length, 12)
  }
})

test('day-of-year calculation handles leap days and calendar-year reset', () => {
  for (const [date, expected] of [
    [new Date(2024, 1, 29, 23, 59), 60],
    [new Date(2024, 11, 31), 366],
    [new Date(2025, 0, 1), 1],
    [new Date(2025, 11, 31), 365]
  ]) {
    assert.equal(getDayOfYear(date), expected)
  }
})

test('schedules the next local midnight across the final millisecond and year boundary', () => {
  const before = new Date(2026, 11, 31, 23, 59, 59, 999)
  const midnight = getNextMidnight(before)
  assert.equal(midnight.getTime() - before.getTime(), 1)
  assert.equal(midnight.getFullYear(), 2027)
  assert.equal(midnight.getMonth(), 0)
  assert.equal(midnight.getDate(), 1)
  assert.equal(midnight.getHours(), 0)
})

test('midnight deadlines follow 23-hour and 25-hour daylight-saving days', t => {
  const previousTimezone = process.env.TZ
  process.env.TZ = 'America/New_York'
  t.after(() => {
    if (previousTimezone === undefined) delete process.env.TZ
    else process.env.TZ = previousTimezone
  })
  for (const [start, hours] of [
    [new Date(2026, 2, 8), 23],
    [new Date(2026, 10, 1), 25]
  ]) {
    const midnight = getNextMidnight(start)
    assert.equal(midnight.getHours(), 0)
    assert.equal(midnight.getTime() - start.getTime(), hours * 3600000)
  }
})
