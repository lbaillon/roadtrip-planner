import { WeatherDataSchema, type WeatherData } from '@roadtrip/shared'

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY

export async function fetchWeatherForPoint(
  lat: number,
  lon: number,
): Promise<WeatherData> {
  if (!OPENWEATHER_API_KEY) {
    // Return mock data for development
    return {
      lat,
      lon,
      temperature: 20 + Math.random() * 10,
      description: 'Clear sky',
      icon: '01d',
      windSpeed: 5,
      humidity: 60,
    }
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`)
  }

  const data = await response.json()

  return WeatherDataSchema.parse({
    lat,
    lon,
    temperature: data.main.temp,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    windSpeed: data.wind.speed,
    humidity: data.main.humidity,
  })
}
