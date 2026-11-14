export interface ControllerState {
  face: string | null
  revision: number
  displayFace: string | null
  online: boolean
  lastSeen: number | null
}

export function parseControllerState(value: unknown): ControllerState {
  if (!value || typeof value !== 'object' || !('face' in value) || !('revision' in value) ||
      !('displayFace' in value) || !('online' in value) || !('lastSeen' in value)) {
    throw new Error('Invalid controller state response')
  }
  const { face, revision, displayFace, online, lastSeen } = value
  if ((face !== null && typeof face !== 'string') || typeof revision !== 'number' || !Number.isInteger(revision) ||
      (displayFace !== null && typeof displayFace !== 'string') || typeof online !== 'boolean' ||
      (lastSeen !== null && (typeof lastSeen !== 'number' || !Number.isFinite(lastSeen)))) {
    throw new Error('Invalid controller state values')
  }
  return { face, revision, displayFace, online, lastSeen }
}

export async function displayRequest<T>(endpoint: string, data?: object): Promise<T> {
  const response = await fetch(`/api/${endpoint}`, {
    method: data ? 'POST' : 'GET',
    headers: { 'X-RPiClock-Display': '1', ...(data ? { 'Content-Type': 'application/json' } : {}) },
    body: data ? JSON.stringify(data) : undefined,
    signal: AbortSignal.timeout(4000)
  })
  if (!response.ok) {
    const result = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null
    throw Object.assign(new Error(result?.error || `Controller HTTP ${response.status}`), { status: response.status })
  }
  return response.json()
}
