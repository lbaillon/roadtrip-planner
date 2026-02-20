import { WeatherDataSchema, type WeatherData } from '@roadtrip/shared'

export async function fetchWeatherForPoint(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY
  if (!OPENWEATHER_API_KEY) {
    throw new Error('API key undefined')
  }

  //for current weather
  // const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`

  //for weather every 3h (starting in 3h) for 24h
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&cnt=8`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`)
  }

  const data = await response.json()

  return WeatherDataSchema.parse({
    lat,
    lon,
    timepoints: data.list.map((point: any) => ({
      time: point.dt,
      temperature: point.main.temp,
      description: point.weather[0].description,
      icon: point.weather[0].icon,
      windSpeed: point.wind.speed,
      humidity: point.main.humidity,
    })),
  })
}
