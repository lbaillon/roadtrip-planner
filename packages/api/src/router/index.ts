import { router, publicProcedure } from '../trpc'
import { z } from 'zod'
import { parseGpxFile, sampleRoutePoints } from '../services/gpx-parser'
import { fetchWeatherForPoint } from '../services/weather'

export const appRouter = router({
  parseGpx: publicProcedure
    .input(z.object({
      gpxContent: z.string()
    }))
    .mutation(async ({ input }) => {
      const parsed = parseGpxFile(input.gpxContent)
      
      // Sample points along the route
      const samplePoints = sampleRoutePoints(parsed.coordinates)
      
      // Fetch weather for each sample point
      const weatherPromises = samplePoints.map(point =>
        fetchWeatherForPoint(point.lat, point.lon)
      )
      
      const weatherData = await Promise.all(weatherPromises)

      return {
        route: parsed,
        weather: weatherData
      }
    })
})

export type AppRouter = typeof appRouter
