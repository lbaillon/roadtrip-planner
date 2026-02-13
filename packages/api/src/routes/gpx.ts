import {
  ParseGpxRequestSchema,
  type ParseGpxRequest,
  type ParseGpxResponse,
} from '@roadtrip/shared'
import { Router } from 'express'
import { parseGpxFile, sampleRoutePoints } from '../services/gpx-parser'
import { fetchWeatherForPoint } from '../services/weather'
import { processPost } from '../utils/route-handler'

const router = Router()

export async function handleParseGpx(
  body: ParseGpxRequest,
): Promise<ParseGpxResponse> {
  const parsed = parseGpxFile(body.gpxContent)
  const samplePoints = sampleRoutePoints(parsed.coordinates)
  const weatherPromises = samplePoints.map((point) =>
    fetchWeatherForPoint(point.lat, point.lon),
  )
  const weatherData = await Promise.all(weatherPromises)

  return {
    route: parsed,
    weather: weatherData,
  }
}

router.post('/', processPost(ParseGpxRequestSchema, handleParseGpx))

export default router
