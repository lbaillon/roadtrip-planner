import { z } from 'zod'

export const GpxCoordinateSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  ele: z.number().nullable().optional()
})

export const WeatherDataSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  temperature: z.number(),
  description: z.string(),
  icon: z.string(),
  windSpeed: z.number().optional(),
  humidity: z.number().optional()
})

export const ParsedGpxSchema = z.object({
  name: z.string().optional(),
  coordinates: z.array(GpxCoordinateSchema),
  distance: z.number().optional()
})

export type GpxCoordinate = z.infer<typeof GpxCoordinateSchema>
export type WeatherData = z.infer<typeof WeatherDataSchema>
export type ParsedGpx = z.infer<typeof ParsedGpxSchema>

