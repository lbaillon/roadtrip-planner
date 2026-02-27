import { ParsedGpxSchema, type ParsedGpx } from '@roadtrip/shared'

import GpxParser from 'gpxparser'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'rtept' || name === 'wpt',
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

  return ParsedGpxSchema.parse({
    name: track.name || 'Unnamed Route',
    coordinates,
    distance: track.distance?.total,
  })
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

export function addWaypointToGpx(
  gpxContent: string,
  waypoint: { lat: number; lon: number; name: string }
): string {
  const parsed = xmlParser.parse(gpxContent)

  const newPoint = {
    '@_lat': waypoint.lat,
    '@_lon': waypoint.lon,
    name: waypoint.name,
  }

  if (parsed.gpx.rte?.rtept) {
    parsed.gpx.rte.rtept.push(newPoint)
  } else if (parsed.gpx.wpt) {
    parsed.gpx.wpt.push(newPoint)
  } else {
    throw new Error('Format GPX non supporté : aucun rtept ou wpt trouvé')
  }

  return xmlBuilder.build(parsed)
}
