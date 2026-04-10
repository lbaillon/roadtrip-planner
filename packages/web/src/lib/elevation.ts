const BATCH_SIZE = 100
const OPEN_METEO_ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation'

async function fetchElevationBatch(
  points: Array<{ lat: number; lon: number }>
): Promise<number[]> {
  const latitudes = points.map((p) => p.lat).join(',')
  const longitudes = points.map((p) => p.lon).join(',')
  const url = `${OPEN_METEO_ELEVATION_URL}?latitude=${latitudes}&longitude=${longitudes}`

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Open-Meteo elevation error: ${response.status}`)
  const data = (await response.json()) as { elevation: number[] }
  return data.elevation
}

export async function fetchElevations(
  points: Array<{ lat: number; lon: number }>
): Promise<number[]> {
  if (points.length === 0) return []

  const batches: Array<Array<{ lat: number; lon: number }>> = []
  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    batches.push(points.slice(i, i + BATCH_SIZE))
  }
  const batchResults = await Promise.all(batches.map(fetchElevationBatch))
  return batchResults.flat()
}
