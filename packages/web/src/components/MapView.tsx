import type { GpxCoordinate, WeatherData } from '@roadtrip/shared'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useState } from 'react'
import Map, { Layer, Marker, Popup, Source } from 'react-map-gl/maplibre'
import styles from './MapView.module.css'

interface MapViewProps {
  coordinates: GpxCoordinate[]
  weather: WeatherData[]
  timepointIndex: number
}

export default function MapView({
  coordinates,
  weather,
  timepointIndex,
}: MapViewProps) {
  const [selectedWeather, setSelectedWeather] = useState<WeatherData | null>(
    null
  )
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [rawPosition, setRawPosition] = useState<{
    lat: number
    lon: number
  } | null>(null)

  const isGeolocationSupported =
    typeof navigator !== 'undefined' && !!navigator.geolocation
  const userPosition = locationEnabled ? rawPosition : null
  const locationError =
    locationEnabled && !isGeolocationSupported
      ? 'Géolocalisation non supportée'
      : null

  useEffect(() => {
    if (!locationEnabled || !isGeolocationSupported) return

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setRawPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      () => {},
      { enableHighAccuracy: true }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [locationEnabled, isGeolocationSupported])

  if (coordinates.length === 0) return null

  const latitudes = coordinates.map((c) => c.lat)
  const longitudes = coordinates.map((c) => c.lon)

  const initialViewState = {
    longitude: (Math.max(...longitudes) + Math.min(...longitudes)) / 2,
    latitude: (Math.max(...latitudes) + Math.min(...latitudes)) / 2,
    zoom: 8,
  }

  const routeGeoJSON = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: coordinates.map((c) => [c.lon, c.lat]),
    },
  }

  return (
    <div className={styles.mapMain}>
      {/* Toggle géolocalisation */}
      <div className={styles.locationToggle}>
        <button
          className={`${styles.toggleButton} ${locationEnabled ? styles.toggleActive : ''}`}
          onClick={() => setLocationEnabled((prev) => !prev)}
          title={
            locationEnabled ? 'Désactiver ma position' : 'Afficher ma position'
          }
          aria-label={
            locationEnabled
              ? 'Désactiver la géolocalisation'
              : 'Activer la géolocalisation'
          }
        >
          <span className={styles.toggleIcon}>📍</span>
          <span className={styles.toggleTrack}>
            <span className={styles.toggleThumb} />
          </span>
        </button>
        {locationError && (
          <span className={styles.locationError}>{locationError}</span>
        )}
      </div>

      <Map
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
      >
        {/* Route line */}
        <Source id="route" type="geojson" data={routeGeoJSON}>
          <Layer
            id="route-line"
            type="line"
            paint={{
              'line-color': '#239182',
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
            <img
              src={`https://openweathermap.org/img/wn/${w.timepoints[timepointIndex].icon}@2x.png`}
              alt={w.timepoints[timepointIndex].description}
              className={styles.weatherIcons}
            />
          </Marker>
        ))}

        {/* User position marker */}
        {locationEnabled && userPosition && (
          <Marker
            longitude={userPosition.lon}
            latitude={userPosition.lat}
            anchor="center"
          >
            <div className={styles.userMarker}>
              <div className={styles.userMarkerPulse} />
              <div className={styles.userMarkerDot} />
            </div>
          </Marker>
        )}

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
              <strong>
                {selectedWeather.timepoints[timepointIndex].description}
              </strong>
              <br />
              🌡️{' '}
              {selectedWeather.timepoints[timepointIndex].temperature.toFixed(
                1
              )}
              °C
              <br />
              💨{' '}
              {selectedWeather.timepoints[timepointIndex].windSpeed?.toFixed(
                1
              )}{' '}
              m/s
              <br />
              💧 {selectedWeather.timepoints[timepointIndex].humidity}% humidity
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
