import gpxParser from 'gpxparser'
import { ParsedGpxSchema, type ParsedGpx } from '@roadtrip/shared'

export function parseGpxFile(gpxContent: string): ParsedGpx {
  const gpx = new gpxParser()
  gpx.parse(gpxContent)

  if (!gpx.tracks || gpx.tracks.length === 0) {
    throw new Error('No tracks found in GPX file')
  }

  const track = gpx.tracks[0]
  const coordinates = track.points.map((point) => ({
    lat: point.lat,
    lon: point.lon,
    ele: point.ele,
  }))

  return ParsedGpxSchema.parse({
    name: track.name || 'Unnamed Route',
    coordinates,
    distance: track.distance?.total,
  })
}

// Sample points along route (e.g., every 50km)
export function sampleRoutePoints(
  coordinates: Array<{ lat: number; lon: number }>,
  intervalMeters: number = 50000,
): Array<{ lat: number; lon: number }> {
  if (coordinates.length === 0) return []

  // For MVP, just sample every Nth point
  const totalPoints = coordinates.length
  const sampleEvery = Math.max(1, Math.floor(totalPoints / 10)) // Max 10 samples

  return coordinates.filter((_, index) => index % sampleEvery === 0)
}
