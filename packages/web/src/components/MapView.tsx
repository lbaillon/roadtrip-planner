import { findNearestIndex } from '#web/lib/gpx-utils'
import { getDirectionsUrl } from '#web/lib/maps-utils'
import { computeRouteSegments } from '#web/lib/route-overlap'
import type { GpxCoordinate, GpxWaypoint, WeatherData } from '@roadtrip/shared'
import type { MenuProps } from 'antd'
import { Button, Dropdown, Switch } from 'antd'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useMemo, useState } from 'react'
import type { MapMouseEvent } from 'react-map-gl/maplibre'
import Map, { Layer, Marker, Popup, Source } from 'react-map-gl/maplibre'
import styles from './MapView.module.css'
import { TRACK_COLORS } from './MapViewTracksColors'

interface MapViewProps {
  subTracks: Array<{ name: string; coordinates: GpxCoordinate[] }>
  coordinates: GpxCoordinate[]
  waypoints?: GpxWaypoint[]
  weather: WeatherData[]
  timepointIndex: number[]
  isEditMode?: boolean
  showEditToggle?: boolean
  onToggleEditMode?: () => void
  onMapClick?: (lat: number, lon: number) => void
  onEditWaypoint?: (
    index: number,
    waypoint: { name: string; description?: string }
  ) => void
  onDeleteWaypoint?: (index: number) => void
  userPosition: {
    lat: number
    lon: number
  } | null
  setUserPosition: (
    position: {
      lat: number
      lon: number
    } | null
  ) => void
  routeColor?: string
}

export default function MapView({
  coordinates,
  subTracks,
  waypoints = [],
  weather,
  timepointIndex,
  isEditMode = false,
  showEditToggle = false,
  onToggleEditMode,
  onMapClick,
  onEditWaypoint,
  onDeleteWaypoint,
  userPosition,
  setUserPosition,
  routeColor,
}: MapViewProps) {
  const [selectedWeather, setSelectedWeather] = useState<WeatherData | null>(
    null
  )
  const [selectedWeatherTimepointIdx, setSelectedWeatherTimepointIdx] =
    useState(0)
  const [selectedWaypoint, setSelectedWaypoint] = useState<GpxWaypoint | null>(
    null
  )
  const [selectedWaypointIndex, setSelectedWaypointIndex] = useState<
    number | null
  >(null)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [waypointsEnabled, setWaypointsEnabled] = useState(false)
  const [weatherEnabled, setWeatherEnabled] = useState(true)
  const [startflagEnable, setStartFlagEnable] = useState(true)
  const [directionEnable, setDirectionEnable] = useState(true)

  const isGeolocationSupported =
    typeof navigator !== 'undefined' && !!navigator.geolocation
  const locationError =
    locationEnabled && !isGeolocationSupported
      ? 'Géolocalisation non supportée'
      : null

  useEffect(() => {
    if (!locationEnabled || !isGeolocationSupported) {
      setUserPosition(null)
      return
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) =>
        setUserPosition({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }),
      () => {},
      { enableHighAccuracy: true }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [locationEnabled, isGeolocationSupported, setUserPosition])

  const routeSegments = useMemo(() => {
    const colors = subTracks.map(
      (_, i) => routeColor ?? TRACK_COLORS[i % TRACK_COLORS.length]
    )
    return computeRouteSegments(subTracks, colors)
  }, [subTracks, routeColor])

  if (coordinates.length === 0) return null

  const latitudes = coordinates.map((c) => c.lat)
  const longitudes = coordinates.map((c) => c.lon)
  const initialViewState = {
    bounds: [
      [Math.min(...longitudes), Math.min(...latitudes)],
      [Math.max(...longitudes), Math.max(...latitudes)],
    ] as [[number, number], [number, number]],
    fitBoundsOptions: { padding: 50 },
  }

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'departure',
      label: (
        <div
          className={styles.dropdownItem}
          onClick={(e) => e.stopPropagation()}
        >
          <span>🚩 Départ</span>
          <Switch
            size="small"
            checked={startflagEnable}
            onChange={(checked) => {
              setStartFlagEnable(checked)
            }}
          />
        </div>
      ),
    },
    {
      key: 'direction',
      label: (
        <div
          className={styles.dropdownItem}
          onClick={(e) => e.stopPropagation()}
        >
          <span>➡️ Sens du trajet</span>
          <Switch
            size="small"
            checked={directionEnable}
            onChange={(checked) => {
              setDirectionEnable(checked)
            }}
          />
        </div>
      ),
    },
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
                <span>🗺️ Points d'intérêt</span>
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

  const startIndex =
    locationEnabled && userPosition
      ? findNearestIndex(coordinates, userPosition.lat, userPosition.lon)
      : 0

  function handleMapClick(e: MapMouseEvent) {
    setSelectedWaypoint(null)
    setSelectedWaypointIndex(null)
    setSelectedWeather(null)
    if (!isEditMode || !onMapClick) return
    onMapClick(e.lngLat.lat, e.lngLat.lng)
  }

  function handleEditClick() {
    if (selectedWaypoint && selectedWaypointIndex !== null && onEditWaypoint) {
      onEditWaypoint(selectedWaypointIndex, {
        name: selectedWaypoint.name ?? '',
        description: selectedWaypoint.desc,
      })
      setSelectedWaypoint(null)
      setSelectedWaypointIndex(null)
    }
  }

  function handleDeleteClick() {
    if (selectedWaypointIndex !== null && onDeleteWaypoint) {
      onDeleteWaypoint(selectedWaypointIndex)
      setSelectedWaypoint(null)
      setSelectedWaypointIndex(null)
    }
  }

  return (
    <div
      className={`${styles.mapMain} ${isEditMode ? styles.mapEditMode : ''}`}
    >
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

      {showEditToggle && (
        <button
          className={`${styles.editModeButton} ${isEditMode ? styles.editModeActive : ''}`}
          onClick={onToggleEditMode}
          aria-label={
            isEditMode
              ? 'Quitter le mode édition'
              : "Modifier les points d'intérêt"
          }
          title={
            isEditMode
              ? 'Quitter le mode édition'
              : "Ajouter / modifier les points d'intérêt"
          }
        >
          ✏️
        </button>
      )}

      {isEditMode && (
        <div className={styles.editModeBanner}>
          Cliquez sur la carte pour ajouter un point
        </div>
      )}

      <Map
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        onClick={handleMapClick}
      >
        {/* Route lines: solid on exclusive portions, alternating dashes on
            shared (overlapping) portions */}
        {routeSegments.map((seg, index) => {
          const geoJSON = {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: seg.coordinates,
            },
          }
          return (
            <Source
              key={`seg-${index}`}
              id={`route-seg-${index}`}
              type="geojson"
              data={geoJSON}
            >
              <Layer
                id={`route-seg-line-${index}`}
                type="line"
                paint={{
                  'line-color': seg.color,
                  'line-width': 4,
                  'line-opacity': 0.8,
                }}
              />
              {seg.altColor && (
                <Layer
                  id={`route-seg-dash-${index}`}
                  type="line"
                  paint={{
                    'line-color': seg.altColor,
                    'line-width': 4,
                    'line-opacity': 0.95,
                    'line-dasharray': [2, 2],
                  }}
                />
              )}
            </Source>
          )
        })}

        {/* Direction arrows on the full track geometry */}
        {directionEnable &&
          subTracks.map((subTrack, index) => {
            const color = routeColor ?? TRACK_COLORS[index % TRACK_COLORS.length]
            const geoJSON = {
              type: 'Feature' as const,
              properties: {},
              geometry: {
                type: 'LineString' as const,
                coordinates: subTrack.coordinates.map((c) => [c.lon, c.lat]),
              },
            }
            return (
              <Source
                key={`dir-${index}`}
                id={`route-dir-${index}`}
                type="geojson"
                data={geoJSON}
              >
                <Layer
                  id={`direction-signs-${index}`}
                  type="symbol"
                  layout={{
                    'symbol-placement': 'line',
                    'text-field': '>',
                    'text-size': 20,
                    'symbol-spacing': 5,
                    'text-keep-upright': false,
                    'text-font': ['Open Sans Bold'],
                  }}
                  paint={{ 'text-color': color }}
                />
              </Source>
            )
          })}
        {startflagEnable && (
          <Marker
            key="departure point"
            longitude={coordinates[startIndex].lon}
            latitude={coordinates[startIndex].lat}
            anchor="bottom"
          >
            {' '}
            <div className={styles.waypointMarker} title="Départ">
              🚩
            </div>
          </Marker>
        )}
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
                setSelectedWaypointIndex(idx)
                setSelectedWeather(null)
              }}
            >
              <div
                className={styles.waypointMarker}
                title={wp.name ?? "Points d'intérêt"}
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
            onClose={() => {
              setSelectedWaypoint(null)
              setSelectedWaypointIndex(null)
            }}
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
              <div className={styles.waypointActions}>
                <a
                  href={getDirectionsUrl(
                    selectedWaypoint.lat,
                    selectedWaypoint.lon,
                    selectedWaypoint.name ?? undefined
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.directionsLink}
                >
                  🧭 S'y rendre
                </a>
              </div>
              {isEditMode && (
                <div className={styles.waypointActions}>
                  <Button size="small" onClick={handleEditClick}>
                    Modifier
                  </Button>
                  <Button size="small" danger onClick={handleDeleteClick}>
                    Supprimer
                  </Button>
                </div>
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
                setSelectedWeatherTimepointIdx(timepointIndex[idx] ?? 0)
              }}
            >
              <img
                src={`https://openweathermap.org/img/wn/${w.timepoints[timepointIndex[idx] ?? 0].icon}@2x.png`}
                alt={w.timepoints[timepointIndex[idx] ?? 0].description}
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
                {
                  selectedWeather.timepoints[selectedWeatherTimepointIdx]
                    .description
                }
              </strong>
              <br />
              🌡️{' '}
              {selectedWeather.timepoints[
                selectedWeatherTimepointIdx
              ].temperature.toFixed(1)}
              °C
              <br />
              💨{' '}
              {selectedWeather.timepoints[
                selectedWeatherTimepointIdx
              ].windSpeed?.toFixed(1)}{' '}
              m/s
              <br />
              💧{' '}
              {selectedWeather.timepoints[selectedWeatherTimepointIdx].humidity}
              % humidity
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
