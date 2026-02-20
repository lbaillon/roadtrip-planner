import {
  ParseGpxRequestSchema,
  type ParseGpxRequest,
  type ParseGpxResponse,
} from '@roadtrip/shared'
import { Router, type Router as RouterType } from 'express'
import { parseGpxFile, sampleRoutePoints } from '../services/gpx-parser.js'
import { fetchWeatherForPoint } from '../services/weather.js'
import { processPost } from '../utils/route-handler.js'

const router: RouterType = Router()

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
