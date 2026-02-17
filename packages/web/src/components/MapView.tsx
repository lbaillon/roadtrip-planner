import Map, { Source, Layer, Marker, Popup } from 'react-map-gl/maplibre'
import type { GpxCoordinate, WeatherData } from '@roadtrip/shared'
import { useState } from 'react'

interface MapViewProps {
  coordinates: GpxCoordinate[]
  weather: WeatherData[]
}

export function MapView({ coordinates, weather }: MapViewProps) {
  const [selectedWeather, setSelectedWeather] = useState<WeatherData | null>(
    null,
  )

  if (coordinates.length === 0) return null

  // Calculate bounds
  const latitudes = coordinates.map((c) => c.lat)
  const longitudes = coordinates.map((c) => c.lon)

  const initialViewState = {
    longitude: (Math.max(...longitudes) + Math.min(...longitudes)) / 2,
    latitude: (Math.max(...latitudes) + Math.min(...latitudes)) / 2,
    zoom: 8,
  }

  // Create GeoJSON LineString from coordinates
  const routeGeoJSON = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: coordinates.map((c) => [c.lon, c.lat]),
    },
  }

  return (
    <div
      style={{
        height: '500px',
        width: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <Map
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      >
        {/* Route line */}
        <Source id="route" type="geojson" data={routeGeoJSON}>
          <Layer
            id="route-line"
            type="line"
            paint={{
              'line-color': '#2563eb',
              'line-width': 4,
              'line-opacity': 0.8,
            }}
          />
        </Source>

        {/* Weather markers */}
        {weather.map((w, idx) => (
          <Marker
            key={idx}
            longitude={w.lon}
            latitude={w.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setSelectedWeather(w)
            }}
          >
            <div
              style={{
                cursor: 'pointer',
                fontSize: '24px',
                transform: 'translate(-50%, -100%)',
              }}
            >
              🌤️
            </div>
          </Marker>
        ))}

        {/* Weather popup */}
        {selectedWeather && (
          <Popup
            longitude={selectedWeather.lon}
            latitude={selectedWeather.lat}
            anchor="top"
            onClose={() => setSelectedWeather(null)}
            closeOnClick={false}
          >
            <div style={{ padding: '8px' }}>
              <strong>{selectedWeather.description}</strong>
              <br />
              🌡️ {selectedWeather.temperature.toFixed(1)}°C
              <br />
              💨 {selectedWeather.windSpeed?.toFixed(1)} m/s
              <br />
              💧 {selectedWeather.humidity}% humidity
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
