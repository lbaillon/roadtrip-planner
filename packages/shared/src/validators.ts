import { z } from 'zod'

export const GpxCoordinateSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  ele: z.number().nullable().optional(),
})

export const WeatherTimepointSchema = z.object({
  time: z.number(),
  temperature: z.number(),
  description: z.string(),
  icon: z.string(),
  windSpeed: z.number().optional(),
  humidity: z.number().optional(),
})

export const WeatherDataSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  timepoints: z.array(WeatherTimepointSchema),
})

export const ParsedGpxSchema = z.object({
  name: z.string().optional(),
  coordinates: z.array(GpxCoordinateSchema),
  distance: z.number().optional(),
})

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
  password: z.string(),
  profilePicture: z.string().optional(),
  createdAt: z.number(),
})

export type GpxCoordinate = z.infer<typeof GpxCoordinateSchema>
export type WeatherData = z.infer<typeof WeatherDataSchema>
export type ParsedGpx = z.infer<typeof ParsedGpxSchema>
export type User = z.infer<typeof UserSchema>
