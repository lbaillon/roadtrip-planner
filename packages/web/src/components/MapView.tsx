import type { GpxCoordinate, GpxWaypoint, WeatherData } from '@roadtrip/shared'
import { Dropdown, Switch } from 'antd'
import type { MenuProps } from 'antd'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useState } from 'react'
import Map, { Layer, Marker, Popup, Source } from 'react-map-gl/maplibre'
import styles from './MapView.module.css'

interface MapViewProps {
  coordinates: GpxCoordinate[]
  waypoints?: GpxWaypoint[]
  weather: WeatherData[]
  timepointIndex: number
}

export default function MapView({
  coordinates,
  waypoints = [],
  weather,
  timepointIndex,
}: MapViewProps) {
  const [selectedWeather, setSelectedWeather] = useState<WeatherData | null>(
    null
  )
  const [selectedWaypoint, setSelectedWaypoint] = useState<GpxWaypoint | null>(
    null
  )
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [waypointsEnabled, setWaypointsEnabled] = useState(true)
  const [weatherEnabled, setWeatherEnabled] = useState(true)
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
      (pos) =>
        setRawPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
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

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'location',
      label: (
        <div
          className={styles.dropdownItem}
          onClick={(e) => e.stopPropagation()}
        >
          <span>📍 Ma position</span>
          <Switch
            size="small"
            checked={locationEnabled}
            onChange={(checked) => {
              setLocationEnabled(checked)
              if (!checked) setRawPosition(null)
            }}
          />
        </div>
      ),
    },
    ...(waypoints.length > 0
      ? [
          {
            key: 'waypoints',
            label: (
              <div
                className={styles.dropdownItem}
                onClick={(e) => e.stopPropagation()}
              >
                <span>🗺️ Waypoints</span>
                <Switch
                  size="small"
                  checked={waypointsEnabled}
                  onChange={(checked) => {
                    setWaypointsEnabled(checked)
                    if (!checked) setSelectedWaypoint(null)
                  }}
                />
              </div>
            ),
          },
        ]
      : []),
    ...(weather.length > 0
      ? [
          {
            key: 'weather',
            label: (
              <div
                className={styles.dropdownItem}
                onClick={(e) => e.stopPropagation()}
              >
                <span>🌤️ Météo</span>
                <Switch
                  size="small"
                  checked={weatherEnabled}
                  onChange={(checked) => {
                    setWeatherEnabled(checked)
                    if (!checked) setSelectedWeather(null)
                  }}
                />
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className={styles.mapMain}>
      <div className={styles.layersControl}>
        <Dropdown
          menu={{ items: dropdownItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <button
            className={styles.layersButton}
            aria-label="Contrôle des calques"
          >
            <span>🗂️</span>
            <span className={styles.layersLabel}>Calques</span>
          </button>
        </Dropdown>
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

        {/* Waypoints markers */}
        {waypointsEnabled &&
          waypoints.map((wp, idx) => (
            <Marker
              key={`wp-${idx}`}
              longitude={wp.lon}
              latitude={wp.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                setSelectedWaypoint(wp)
                setSelectedWeather(null)
              }}
            >
              <div
                className={styles.waypointMarker}
                title={wp.name ?? 'Waypoint'}
              >
                📌
              </div>
            </Marker>
          ))}

        {/* Waypoint popup */}
        {selectedWaypoint && (
          <Popup
            longitude={selectedWaypoint.lon}
            latitude={selectedWaypoint.lat}
            anchor="top"
            onClose={() => setSelectedWaypoint(null)}
            closeOnClick={false}
          >
            <div style={{ padding: '8px', minWidth: '120px' }}>
              <strong>{selectedWaypoint.name ?? 'Point'}</strong>
              {selectedWaypoint.desc && (
                <>
                  <br />
                  <span>{selectedWaypoint.desc}</span>
                </>
              )}
              {selectedWaypoint.ele != null && (
                <>
                  <br />
                  ⛰️ {selectedWaypoint.ele.toFixed(0)} m
                </>
              )}
            </div>
          </Popup>
        )}

        {/* Weather markers */}
        {weatherEnabled &&
          weather.map((w, idx) => (
            <Marker
              key={idx}
              longitude={w.lon}
              latitude={w.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                setSelectedWeather(w)
                setSelectedWaypoint(null)
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
        {weatherEnabled && selectedWeather && (
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
