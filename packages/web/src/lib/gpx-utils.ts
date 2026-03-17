import {
  ParsedGpxSchema,
  type GpxWaypoint,
  type ParsedGpx,
} from '@roadtrip/shared'
import GpxParser from 'gpxparser'
import { XMLBuilder, XMLParser } from 'fast-xml-parser'

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'rtept' || name === 'wpt' || name === 'rte',
})

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
})

export function parseGpxFile(gpxContent: string): ParsedGpx {
  const gpx = new GpxParser()
  gpx.parse(gpxContent)

  if (!gpx.tracks || gpx.tracks.length === 0) {
    throw new Error('No tracks found in GPX file')
  }

  const track = gpx.tracks[0]
  const coordinates = track.points.map(
    (point: { lat: number; lon: number; ele?: number }) => ({
      lat: point.lat,
      lon: point.lon,
      ele: point.ele,
    })
  )

  const waypoints = extractWaypoints(gpxContent)
  return ParsedGpxSchema.parse({
    name: track.name || gpx.metadata?.name || 'Unnamed Route',
    coordinates,
    distance: track.distance?.total,
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

export function sampleRoutePoints(
  coordinates: Array<{ lat: number; lon: number }>
): Array<{ lat: number; lon: number }> {
  if (coordinates.length === 0) return []
  const totalPoints = coordinates.length
  const sampleEvery = Math.max(1, Math.floor(totalPoints / 10))
  return coordinates.filter((_, index) => index % sampleEvery === 0)
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
    ;((rtes[0] as Record<string, unknown>).rtept as unknown[]).push(newPoint)
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
