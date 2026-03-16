import {
  ParsedGpxSchema,
  type ParsedGpx,
  type GpxWaypoint,
} from '@roadtrip/shared'

import GpxParser from 'gpxparser'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { BadRequestError } from '#api/errors/app-errors.js'
import { codes } from '#api/errors/error-codes.js'

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'rtept' || name === 'wpt' || name === 'rte', // 'rte' ajouté pour supporter plusieurs routes
})

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
})

export function parseGpxFile(gpxContent: string): ParsedGpx {
  // @ts-expect-error Could not fix 'This expression is not constructable'
  const gpx = new GpxParser()
  gpx.parse(gpxContent)

  if (!gpx.tracks || gpx.tracks.length === 0) {
    throw new BadRequestError('No tracks found in GPX file', codes.WRONG_GPX)
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

// Extrait <wpt> et <rtept> via fast-xml-parser
// Gère la balise <n> non-standard de Liberty Rider en plus de <name>
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
    name: (el['name'] ?? el['n'] ?? undefined) as string | undefined, // fallback <n> Liberty Rider
    desc: el['desc'] as string | undefined,
    ele: el['ele'] != null ? parseFloat(String(el['ele'])) : undefined,
    type,
  })

  // <wpt> standalone
  const wpts: unknown[] = Array.isArray(gpxData.wpt)
    ? gpxData.wpt
    : gpxData.wpt
      ? [gpxData.wpt]
      : []
  wpts.forEach((w) =>
    results.push(toWaypoint(w as Record<string, unknown>, 'wpt'))
  )

  // <rtept> dans <rte> (isArray: 'rte' garanti un tableau même si une seule route)
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

// Sample points along route (e.g., every 50km)
export function sampleRoutePoints(
  coordinates: Array<{ lat: number; lon: number }>
): Array<{ lat: number; lon: number }> {
  if (coordinates.length === 0) return []

  // For MVP, just sample every Nth point
  const totalPoints = coordinates.length
  const sampleEvery = Math.max(1, Math.floor(totalPoints / 10)) // Max 10 samples

  return coordinates.filter((_, index) => index % sampleEvery === 0)
}

// Returns mutable references to all waypoint elements in extraction order (wpt first, then rtept)
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
    // No existing waypoints — create a wpt array
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
    throw new BadRequestError('Waypoint index out of bounds', codes.WRONG_GPX)
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
    throw new BadRequestError('Waypoint index out of bounds', codes.WRONG_GPX)
  }

  const ref = refs[index]
  ref.array.splice(ref.localIndex, 1)

  return xmlBuilder.build(parsed)
}
