import { useEffect, useRef, useState } from 'react'
import { displayRequest, parseControllerState } from './controllerApi'

export default function useDisplayController(enabled: boolean, face: string, selectFace: (face: string) => void) {
  const currentFace = useRef(face)
  const select = useRef(selectFace)
  currentFace.current = face
  select.current = selectFace
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    let stopped = false
    let timeout: number
    let seenRevision = -1
    let pendingFace: string | null = null
    const poll = async () => {
      try {
        if (document.visibilityState !== 'visible') return
        const state = parseControllerState(await displayRequest<unknown>('display'))
        if (stopped || document.visibilityState !== 'visible') return
        if (state.revision !== seenRevision) {
          seenRevision = state.revision
          pendingFace = state.face
          if (pendingFace && pendingFace !== currentFace.current) select.current(pendingFace)
        }
        if (!pendingFace || pendingFace === currentFace.current) {
          const acknowledged = parseControllerState(await displayRequest<unknown>('display', {
            face: currentFace.current, revision: seenRevision
          }))
          if (stopped) return
          seenRevision = acknowledged.revision
          pendingFace = null
        }
        setError(null)
      } catch (failure) {
        if (stopped) return
        if (failure instanceof Error && 'status' in failure && failure.status === 409) {
          seenRevision = -1
        } else {
          console.error('Display controller synchronization failed:', failure)
          setError('Remote controller is unavailable. Local face controls still work.')
        }
      } finally {
        if (!stopped) timeout = window.setTimeout(poll, 1000)
      }
    }
    const activate = () => {
      if (document.visibilityState === 'visible') seenRevision = -1
    }
    document.addEventListener('visibilitychange', activate)
    void poll()
    return () => {
      stopped = true
      window.clearTimeout(timeout)
      document.removeEventListener('visibilitychange', activate)
    }
  }, [enabled])
  return error
}
