import { useCallback, useEffect, useState } from 'react'
import faces from '../clockFaces.json'
import type { ControllerState } from '../controllerApi'
import { parseControllerState } from '../controllerApi'
import './ControllerPage.css'

export default function ControllerPage() {
  const [state, setState] = useState<ControllerState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const request = useCallback(async (face?: string) => {
    const response = await fetch('/api/controller', {
      method: face ? 'POST' : 'GET',
      headers: face ? { 'Content-Type': 'application/json' } : undefined,
      body: face ? JSON.stringify({ face }) : undefined,
      signal: AbortSignal.timeout(5000)
    })
    if (!response.ok) {
      const result = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null
      throw new Error(result?.error || `Controller unavailable (HTTP ${response.status})`)
    }
    return parseControllerState(await response.json())
  }, [])

  useEffect(() => {
    let stopped = false
    let timeout: number
    const update = async () => {
      try {
        const next = await request()
        if (!stopped) { setState(next); setError(null) }
      } catch (failure) {
        if (!stopped) {
          console.error('Controller status failed:', failure)
          setError(failure instanceof Error ? failure.message : 'Could not read controller status')
        }
      } finally {
        if (!stopped) timeout = window.setTimeout(update, 1500)
      }
    }
    void update()
    return () => { stopped = true; window.clearTimeout(timeout) }
  }, [request])

  const selectFace = async (face: string) => {
    setPending(true)
    try {
      setState(await request(face))
      setError(null)
    } catch (failure) {
      console.error('Remote face selection failed:', failure)
      setError(failure instanceof Error ? failure.message : 'Face could not be selected')
    } finally { setPending(false) }
  }
  const active = faces.find(face => face.id === state?.displayFace)
  return (
    <main className="controller-page">
      <div className="controller-content">
        <h1>Clock faces</h1>
        <p className="controller-status" role="status">
          {!state?.online ? 'Waiting for the Pi’s display' :
            state.face !== state.displayFace ? 'Switching face…' : `On the LCD: ${active?.name || state.displayFace}`}
        </p>
        <div className="controller-face-grid">
          {faces.map(face => (
            <button key={face.id} className="controller-face-button"
              style={{ borderColor: state?.face === face.id ? face.accent : undefined }}
              disabled={pending} aria-pressed={state?.face === face.id}
              onClick={() => void selectFace(face.id)}>
              <span className="controller-face-swatch" style={{ background: face.accent }} />
              <span>{face.name}</span>
            </button>
          ))}
        </div>
        {error && <p className="controller-error" role="alert">{error}</p>}
      </div>
    </main>
  )
}
