import { fetchWeatherForPoint } from '#api/services/weather.js'
import { processPost } from '#api/utils/route-handler.js'
import {
  GetWeatherRequestSchema,
  type GetWeatherRequest,
  type GetWeatherResponse,
} from '@roadtrip/shared'
import { Router } from 'express'

const router: Router = Router()

async function handleGetWeather(
  body: GetWeatherRequest
): Promise<GetWeatherResponse> {
  return Promise.all(
    body.coordinates.map((point) =>
      fetchWeatherForPoint(point.lat, point.lon)
    )
  )
}

router.post(
  '/',
  processPost({
    bodySchema: GetWeatherRequestSchema,
    handler: ({ body }) => handleGetWeather(body),
  })
)

export default router
