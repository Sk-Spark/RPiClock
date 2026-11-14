import { bitmapGlyphs } from '../utils/bitmapFont'

interface BitmapTextProps {
  text: string
  step: number
  x?: number
  y?: number
  shape?: 'round' | 'square'
  pixelGap?: number
  className?: string
}

export default function BitmapText({ text, step, x = 0, y = 0, shape = 'round', pixelGap = 0.1, className = 'matrix-text' }: BitmapTextProps) {
  return (
    <g className={className} transform={`translate(${x} ${y})`} aria-hidden="true">
      {text.toUpperCase().split('').map((character, index) => {
        const glyph = bitmapGlyphs[character]
        if (!glyph) throw new RangeError(`Unsupported bitmap character: ${character}`)
        return (
          <g key={index} data-character={character} transform={`translate(${index * 6 * step} 0)`}>
            {glyph.split('/').flatMap((row, rowIndex) => row.split('').map((bit, column) => bit === '1' && (
              shape === 'square' ? (
                <rect key={`${rowIndex}-${column}`} fill="currentColor"
                  x={column * step} y={rowIndex * step} width={step * (1 - pixelGap)} height={step * (1 - pixelGap)} />
              ) : (
                <g key={`${rowIndex}-${column}`}>
                  <circle className="matrix-led" cx={(column + 0.5) * step} cy={(rowIndex + 0.5) * step} r={step * 0.32} />
                  <circle className="matrix-led-core" cx={(column + 0.5) * step} cy={(rowIndex + 0.5) * step} r={step * 0.12} />
                </g>
              )
            )))}
          </g>
        )
      })}
    </g>
  )
}
