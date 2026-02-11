import { useState } from 'react'
import { GpxUploader } from './components/GpxUploader'
import { MapView } from './components/MapView'
import { trpc } from './lib/trpc'
import type { ParsedGpx, WeatherData } from '@roadtrip/shared'

function App() {
  const [routeData, setRouteData] = useState<{
    route: ParsedGpx
    weather: WeatherData[]
  } | null>(null)

  const parseGpxMutation = trpc.parseGpx.useMutation({
    onSuccess: (data) => {
      setRouteData(data)
    },
    onError: (error) => {
      alert(`Error: ${error.message}`)
    }
  })

  const handleFileSelect = (content: string) => {
    parseGpxMutation.mutate({ gpxContent: content })
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        🚗 Roadtrip Weather Planner
      </h1>

      <GpxUploader onFileSelect={handleFileSelect} />

      {parseGpxMutation.isPending && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Loading route and weather data...</p>
        </div>
      )}

      {routeData && (
        <div style={{ marginTop: '30px' }}>
          <h2>{routeData.route.name}</h2>
          {routeData.route.distance && (
            <p>Distance: {(routeData.route.distance / 1000).toFixed(2)} km</p>
          )}
          
          <MapView
            coordinates={routeData.route.coordinates}
            weather={routeData.weather}
          />

          <div style={{ marginTop: '20px' }}>
            <h3>Weather Along Route</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
              {routeData.weather.map((w, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: '#f9f9f9'
                  }}
                >
                  <p><strong>{w.description}</strong></p>
                  <p>🌡️ {w.temperature.toFixed(1)}°C</p>
                  <p>💨 {w.windSpeed?.toFixed(1)} m/s</p>
                  <p>💧 {w.humidity}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
