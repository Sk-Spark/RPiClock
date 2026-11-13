const segmentPoints: Record<string, string> = {
  a: '25,0 75,0 86,12 75,24 25,24 14,12',
  b: '88.5,16 100,28 100,72 88.5,84 77,72 77,28',
  c: '88.5,96 100,108 100,152 88.5,164 77,152 77,108',
  d: '25,156 75,156 86,168 75,180 25,180 14,168',
  e: '11.5,96 23,108 23,152 11.5,164 0,152 0,108',
  f: '11.5,16 23,28 23,72 11.5,84 0,72 0,28',
  g: '25,78 75,78 86,90 75,102 25,102 14,90'
}

const digitSegments: Partial<Record<string, string>> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abdeg',
  '3': 'abcdg',
  '4': 'bcfg',
  '5': 'acdfg',
  '6': 'acdefg',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg'
}

export default function SevenSegmentDigit({ digit }: { digit: string }) {
  const activeSegments = digitSegments[digit]
  if (!activeSegments) {
    throw new RangeError(`Invalid seven-segment digit: ${digit}`)
  }

  return (
    <svg className="retro-digit" viewBox="0 0 100 180" aria-hidden="true">
      {Object.entries(segmentPoints).map(([segment, points]) => (
        <polygon
          key={segment}
          points={points}
          data-segment={segment}
          className={`retro-segment ${activeSegments.includes(segment) ? 'retro-segment-on' : 'retro-segment-off'}`}
        />
      ))}
    </svg>
  )
}
