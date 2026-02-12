import { ParseGpxRequest, ParseGpxResponse } from "@roadtrip/shared"
import { parseGpxFile, sampleRoutePoints } from "../services/gpx-parser"
import { fetchWeatherForPoint } from "../services/weather"

export async function handleParseGpx(body: ParseGpxRequest): Promise<ParseGpxResponse> {
  const parsed = parseGpxFile(body.gpxContent)
  const samplePoints = sampleRoutePoints(parsed.coordinates)
  const weatherPromises = samplePoints.map(point =>
    fetchWeatherForPoint(point.lat, point.lon)
  )
  const weatherData = await Promise.all(weatherPromises)

  return {
    route: parsed,
    weather: weatherData
  }
}