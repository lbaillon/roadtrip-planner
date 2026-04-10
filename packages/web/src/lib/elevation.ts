const BATCH_SIZE = 100
const OPEN_ELEVATION_URL = 'https://api.open-elevation.com/api/v1/lookup'

export async function fetchElevations(
  points: Array<{ lat: number; lon: number }>
): Promise<number[]> {
  if (points.length === 0) return []

  const batches: Array<Array<{ lat: number; lon: number }>> = []
  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    batches.push(points.slice(i, i + BATCH_SIZE))
  }

  const batchResults = await Promise.all(
    batches.map(async (batch) => {
      const response = await fetch(OPEN_ELEVATION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locations: batch.map(({ lat, lon }) => ({
            latitude: lat,
            longitude: lon,
          })),
        }),
      })
      if (!response.ok) throw new Error(`Open-Elevation error: ${response.status}`)
      const data = (await response.json()) as {
        results: { latitude: number; longitude: number; elevation: number }[]
      }
      return data.results.map((r) => r.elevation)
    })
  )

  return batchResults.flat()
}
