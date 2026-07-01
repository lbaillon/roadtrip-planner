import type { GpxCoordinate } from '@roadtrip/shared'

export type RenderSegment = {
  coordinates: [number, number][]
  color: string
  altColor?: string
}

const DEG_METERS = 111320

export function computeRouteSegments(
  subTracks: { coordinates: GpxCoordinate[] }[],
  colors: string[],
  toleranceMeters = 15
): RenderSegment[] {
  const cell = toleranceMeters / DEG_METERS

  const grid = new Map<string, Set<number>>()
  subTracks.forEach((track, ti) => {
    for (const c of track.coordinates) {
      const key = `${Math.round(c.lat / cell)}:${Math.round(c.lon / cell)}`
      const set = grid.get(key)
      if (set) {
        set.add(ti)
      } else {
        grid.set(key, new Set([ti]))
      }
    }
  })

  const othersAt = (lat: number, lon: number, self: number): Set<number> => {
    const others = new Set<number>()
    const gx = Math.round(lat / cell)
    const gy = Math.round(lon / cell)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const set = grid.get(`${gx + dx}:${gy + dy}`)
        if (!set) continue
        for (const t of set) if (t !== self) others.add(t)
      }
    }
    return others
  }

  const segments: RenderSegment[] = []

  subTracks.forEach((track, ti) => {
    const pts = track.coordinates
    if (pts.length < 2) return

    const pointOthers = pts.map((c) => othersAt(c.lat, c.lon, ti))

    const treat = (k: number): { key: string; altColor?: string } => {
      const a = pointOthers[k]
      const b = pointOthers[k + 1]
      const shared = [...a].filter((x) => b.has(x))
      if (shared.length === 0) return { key: 'solid' }
      const group = [ti, ...shared].sort((x, y) => x - y)
      // The shared portion is drawn once, by the lowest-index track.
      if (group[0] !== ti) return { key: 'skip' }
      const altIndex = group[1]
      return { key: `dash:${altIndex}`, altColor: colors[altIndex] }
    }

    const pushRun = (
      start: number,
      end: number,
      treatment: { key: string; altColor?: string }
    ) => {
      if (treatment.key === 'skip' || end <= start) return
      segments.push({
        coordinates: pts.slice(start, end + 1).map((c) => [c.lon, c.lat]),
        color: colors[ti],
        altColor: treatment.altColor,
      })
    }

    let runStart = 0
    let current = treat(0)
    for (let k = 1; k <= pts.length - 2; k++) {
      const t = treat(k)
      if (t.key !== current.key) {
        pushRun(runStart, k, current)
        runStart = k
        current = t
      }
    }
    pushRun(runStart, pts.length - 1, current)
  })

  return segments
}
