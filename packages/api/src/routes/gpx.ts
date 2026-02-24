import { parseGpxFile, sampleRoutePoints } from '#api/services/gpx-parser.js'
import { fetchWeatherForPoint } from '#api/services/weather.js'
import { processPost } from '#api/utils/route-handler.js'
import {
  ParseGpxRequestSchema,
  type ParseGpxRequest,
  type ParseGpxResponse,
} from '@roadtrip/shared'
import { Router } from 'express'

const router: Router = Router()

export async function handleParseGpx(
  body: ParseGpxRequest
): Promise<ParseGpxResponse> {
  const parsed = parseGpxFile(body.gpxContent)
  const samplePoints = sampleRoutePoints(parsed.coordinates)
  const weatherPromises = samplePoints.map((point) =>
    fetchWeatherForPoint(point.lat, point.lon)
  )
  const weatherData = await Promise.all(weatherPromises)

  return {
    route: parsed,
    weather: weatherData,
  }
}

router.post('/', processPost(ParseGpxRequestSchema, handleParseGpx))

export default router
