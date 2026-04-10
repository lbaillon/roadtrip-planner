import {
  ParsedGpxSchema,
  type GpxCoordinate,
  type GpxWaypoint,
  type ParsedGpx,
} from '@roadtrip/shared'
import { XMLBuilder, XMLParser } from 'fast-xml-parser'

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) =>
    name === 'rtept' ||
    name === 'wpt' ||
    name === 'rte' ||
    name === 'trk' ||
    name === 'trkseg' ||
    name === 'trkpt',
})

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
})

export function parseGpxFile(gpxContent: string): ParsedGpx {
  const parsed = xmlParser.parse(gpxContent)
  const gpxData = parsed?.gpx

  const trks: unknown[] = gpxData?.trk ?? []
  if (trks.length === 0) {
    throw new Error('No tracks found in GPX file')
  }

  const trk = trks[0] as Record<string, unknown>
  const trksegs: unknown[] = (trk.trkseg as unknown[]) ?? []

  const coordinates: Array<{ lat: number; lon: number; ele?: number }> = []
  for (const seg of trksegs) {
    const trkpts: unknown[] =
      ((seg as Record<string, unknown>).trkpt as unknown[]) ?? []
    for (const pt of trkpts) {
      const p = pt as Record<string, unknown>
      coordinates.push({
        lat: parseFloat(String(p['@_lat'])),
        lon: parseFloat(String(p['@_lon'])),
        ele: p.ele != null ? parseFloat(String(p.ele)) : undefined,
      })
    }
  }
  let distanceM = 0
  for (let i = 1; i < coordinates.length; i++) {
    distanceM += haversineDistanceKm(coordinates[i - 1], coordinates[i]) * 1000
  }
  const name = String(
    trk.name ??
      (gpxData?.metadata as Record<string, unknown> | undefined)?.name ??
      'Unnamed Route'
  )
  const waypoints = extractWaypoints(gpxContent)
  return ParsedGpxSchema.parse({
    name,
    coordinates,
    distance: distanceM,
    waypoints,
  })
}

// Extracts <wpt> and <rtept> via fast-xml-parser
// Handles Liberty Rider's non-standard <n> tag in addition to <name>
function extractWaypoints(gpxContent: string): GpxWaypoint[] {
  const parsed = xmlParser.parse(gpxContent)
  const gpxData = parsed?.gpx
  if (!gpxData) return []

  const results: GpxWaypoint[] = []

  const toWaypoint = (
    el: Record<string, unknown>,
    type: 'wpt' | 'rtept'
  ): GpxWaypoint => ({
    lat: parseFloat(String(el['@_lat'])),
    lon: parseFloat(String(el['@_lon'])),
    name: (el['name'] ?? el['n'] ?? undefined) as string | undefined,
    desc: el['desc'] as string | undefined,
    ele: el['ele'] != null ? parseFloat(String(el['ele'])) : undefined,
    type,
  })
  const wpts: unknown[] = Array.isArray(gpxData.wpt)
    ? gpxData.wpt
    : gpxData.wpt
      ? [gpxData.wpt]
      : []
  wpts.forEach((w) =>
    results.push(toWaypoint(w as Record<string, unknown>, 'wpt'))
  )
  const rtes = Array.isArray(gpxData.rte)
    ? gpxData.rte
    : gpxData.rte
      ? [gpxData.rte]
      : []
  rtes.forEach((rte: Record<string, unknown>) => {
    const rtepts: unknown[] = Array.isArray(rte.rtept)
      ? rte.rtept
      : rte.rtept
        ? [rte.rtept]
        : []
    rtepts.forEach((pt) =>
      results.push(toWaypoint(pt as Record<string, unknown>, 'rtept'))
    )
  })
  return results
}

export function haversineDistanceKm(
  p1: { lat: number; lon: number },
  p2: { lat: number; lon: number }
): number {
  const R = 6371
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180
  const dLon = ((p2.lon - p1.lon) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function sampleRoutePointsWithCumulativeKm(
  coordinates: Array<{ lat: number; lon: number }>,
  totalDistanceKm: number
): Array<{ lat: number; lon: number; cumulativeKm: number }> {
  if (coordinates.length === 0) return []
  const totalPoints = coordinates.length
  const intervalKm = Math.max(10, totalDistanceKm / 17)
  let nextThreshold = 0
  const sampled: Array<{ lat: number; lon: number; cumulativeKm: number }> = []
  let cumulativeKm = 0
  let prevPoint = coordinates[0]
  for (let i = 0; i < totalPoints; i++) {
    cumulativeKm += haversineDistanceKm(prevPoint, coordinates[i])
    prevPoint = coordinates[i]
    if (cumulativeKm >= nextThreshold) {
      sampled.push({ ...coordinates[i], cumulativeKm })
      nextThreshold += intervalKm
    }
  }
  return sampled
}

export function findNearestIndex(
  coords: GpxCoordinate[],
  lat: number,
  lon: number
) {
  let minDist = Infinity
  let nearest = 0
  for (let i = 0; i < coords.length; i++) {
    const d = (coords[i].lat - lat) ** 2 + (coords[i].lon - lon) ** 2
    if (d < minDist) {
      minDist = d
      nearest = i
    }
  }
  return nearest
}

function getAllWaypointRefs(
  parsed: ReturnType<typeof xmlParser.parse>
): { array: unknown[]; localIndex: number }[] {
  const gpx = parsed?.gpx
  const refs: { array: unknown[]; localIndex: number }[] = []

  const wpts: unknown[] = Array.isArray(gpx?.wpt) ? gpx.wpt : []
  wpts.forEach((_, i) => refs.push({ array: wpts, localIndex: i }))

  const rtes: unknown[] = Array.isArray(gpx?.rte) ? gpx.rte : []
  rtes.forEach((rte: unknown) => {
    const rtepts: unknown[] = Array.isArray(
      (rte as Record<string, unknown>).rtept
    )
      ? ((rte as Record<string, unknown>).rtept as unknown[])
      : []
    rtepts.forEach((_, i) => refs.push({ array: rtepts, localIndex: i }))
  })

  return refs
}

export function addWaypointToGpx(
  gpxContent: string,
  waypoint: { lat: number; lon: number; name: string; description?: string }
): string {
  const parsed = xmlParser.parse(gpxContent)

  const newPoint: Record<string, unknown> = {
    '@_lat': waypoint.lat,
    '@_lon': waypoint.lon,
    name: waypoint.name,
    ...(waypoint.description ? { desc: waypoint.description } : {}),
  }
  const rtes: unknown[] = Array.isArray(parsed.gpx?.rte) ? parsed.gpx.rte : []
  if (
    rtes.length > 0 &&
    Array.isArray((rtes[0] as Record<string, unknown>).rtept)
  ) {
    const rtept = (rtes[0] as Record<string, unknown>).rtept as unknown[]
    rtept.push(newPoint)
  } else if (Array.isArray(parsed.gpx?.wpt)) {
    parsed.gpx.wpt.push(newPoint)
  } else {
    parsed.gpx.wpt = [newPoint]
  }
  return xmlBuilder.build(parsed)
}

export function editWaypointInGpx(
  gpxContent: string,
  index: number,
  data: { name: string; description?: string }
): string {
  const parsed = xmlParser.parse(gpxContent)
  const refs = getAllWaypointRefs(parsed)

  if (index < 0 || index >= refs.length) {
    throw new Error('Waypoint index out of bounds')
  }

  const ref = refs[index]
  const elem = ref.array[ref.localIndex] as Record<string, unknown>
  elem['name'] = data.name
  if (data.description) {
    elem['desc'] = data.description
  } else {
    delete elem['desc']
  }

  return xmlBuilder.build(parsed)
}

export function deleteWaypointFromGpx(
  gpxContent: string,
  index: number
): string {
  const parsed = xmlParser.parse(gpxContent)
  const refs = getAllWaypointRefs(parsed)

  if (index < 0 || index >= refs.length) {
    throw new Error('Waypoint index out of bounds')
  }

  const ref = refs[index]
  ref.array.splice(ref.localIndex, 1)

  return xmlBuilder.build(parsed)
}

export function isLoop(
  coordinates: Array<{ lat: number; lon: number }>,
  thresholdKm = 0.5
): boolean {
  if (coordinates.length < 2) return false
  const first = coordinates[0]
  const last = coordinates[coordinates.length - 1]
  return haversineDistanceKm(first, last) <= thresholdKm
}

export function remapCoordinatesFrom(
  coordinates: Array<{ lat: number; lon: number }>,
  from: { lat: number; lon: number }
) {
  const remappedCoords = []
  const startIndex = findNearestIndex(coordinates, from.lat, from.lon)
  for (let i = startIndex; i < coordinates.length; i++) {
    remappedCoords.push(coordinates[i])
  }
  if (isLoop(coordinates)) {
    for (let i = 0; i < startIndex; i++) {
      remappedCoords.push(coordinates[i])
    }
  }
  return remappedCoords
}

export function invertGpxTrack(gpxContent: string): string {
  const parsed = xmlParser.parse(gpxContent)

  parsed.gpx?.trk?.reverse()
  for (const trk of parsed.gpx?.trk ?? []) {
    trk.trkseg.reverse()
    for (const seg of trk.trkseg) {
      seg.trkpt.reverse()
    }
  }

  for (const rte of parsed.gpx?.rte ?? []) {
    rte.rtept.reverse()
  }

  return xmlBuilder.build(parsed)
}
