import { HumidityChart } from '#web/components/HumidityChart'
import { TimeSelector } from '#web/components/TimeSelector'
import WaypointFormModal from '#web/components/WaypointFormModal'
import { useGetWeather } from '#web/hooks/useApi'
import { useAuth } from '#web/hooks/useAuth'
import {
  useAddWaypoint,
  useDeleteWaypoint,
  useEditWaypoint,
} from '#web/hooks/useTracks'
import {
  sampleRoutePoints,
  sampleRoutePointsWithCumulativeKm,
} from '#web/lib/gpx-utils'
import type { ParsedGpx } from '@roadtrip/shared'
import { Button, InputNumber, message, TimePicker } from 'antd'
import { lazy, Suspense, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import styles from './TrackContent.module.css'

const MapView = lazy(() => import('#web/components/MapView'))
type WaypointFormData = { name: string; description?: string }
type EditingWaypoint = { index: number } & WaypointFormData

export default function TrackContent({ parsed }: { parsed: ParsedGpx }) {
  const [timepointIndex, setTimepointIndex] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingClickCoords, setPendingClickCoords] = useState<{
    lat: number
    lon: number
  } | null>(null)
  const [editingWaypoint, setEditingWaypoint] =
    useState<EditingWaypoint | null>(null)
  const [useCustomTime, setUseCustomTime] = useState(false)
  const [departureTime, setDepartureTime] = useState<Date | null>(null)
  const [speedKmh, setSpeedKmh] = useState<number | null>(50)

  const [messageApi, contextHolder] = message.useMessage()
  const { id } = useParams()
  const { accessToken } = useAuth()

  const {
    data: weather,
    isPending: weatherLoading,
    isError,
    error,
  } = useGetWeather({ coordinates: sampleRoutePoints(parsed.coordinates) })

  const { mutate: addWaypoint, isPending: isAdding } = useAddWaypoint(id ?? '')
  const { mutate: editWaypoint, isPending: isEditing } = useEditWaypoint(
    id ?? ''
  )
  const { mutate: deleteWaypoint } = useDeleteWaypoint(id ?? '')

  const timepointIndices = useMemo(() => {
    if (!departureTime || !speedKmh || !weather || !parsed) return null

    const departureMs = departureTime.getTime()

    const sampledWithKm = sampleRoutePointsWithCumulativeKm(parsed.coordinates)

    return sampledWithKm.map((point, i) => {
      const estimatedMs =
        departureMs + (point.cumulativeKm / speedKmh) * 3600 * 1000
      const estimatedSec = estimatedMs / 1000
      const timepoints = weather[i]?.timepoints ?? []
      return timepoints.reduce(
        (bestIdx, tp, idx) =>
          Math.abs(tp.time - estimatedSec) <
          Math.abs(timepoints[bestIdx].time - estimatedSec)
            ? idx
            : bestIdx,
        0
      )
    })
  }, [departureTime, speedKmh, weather, parsed])

  function handleMapClick(lat: number, lon: number) {
    setPendingClickCoords({ lat, lon })
    setEditingWaypoint(null)
    setIsModalOpen(true)
  }

  function handleEditWaypoint(
    index: number,
    waypoint: { name: string; description?: string }
  ) {
    setEditingWaypoint({ index, ...waypoint })
    setPendingClickCoords(null)
    setIsModalOpen(true)
  }

  function handleDeleteWaypoint(index: number) {
    deleteWaypoint(index, {
      onError: () => messageApi.error('Failed to delete waypoint'),
    })
  }

  function handleModalSubmit(data: WaypointFormData) {
    const cleanData: WaypointFormData = {
      name: data.name,
      description: data.description || undefined,
    }
    if (editingWaypoint) {
      editWaypoint(
        { index: editingWaypoint.index, ...cleanData },
        {
          onSuccess: () => {
            setIsModalOpen(false)
            setEditingWaypoint(null)
          },
          onError: () => messageApi.error('Failed to edit waypoint'),
        }
      )
    } else if (pendingClickCoords) {
      addWaypoint(
        {
          ...pendingClickCoords,
          name: cleanData.name,
          description: cleanData.description,
        },
        {
          onSuccess: () => {
            setIsModalOpen(false)
            setPendingClickCoords(null)
          },
          onError: () => messageApi.error('Failed to add waypoint'),
        }
      )
    }
  }

  function handleModalClose() {
    setIsModalOpen(false)
    setEditingWaypoint(null)
    setPendingClickCoords(null)
  }

  return (
    <div className={styles.mapBox}>
      {contextHolder}
      <h2 className={styles.routeName}>{parsed.name}</h2>
      {parsed.distance && (
        <p className={styles.routeName}>
          Distance: {(parsed.distance / 1000).toFixed(2)} km
        </p>
      )}
      {weatherLoading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Loading weather data...</p>
        </div>
      )}
      {isError && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Error occurred: {error.message}</p>
        </div>
      )}
      <Suspense fallback={<div>Loading map...</div>}>
        <MapView
          coordinates={parsed.coordinates}
          weather={weather ?? []}
          timepointIndex={timepointIndices ?? timepointIndex}
          waypoints={parsed.waypoints}
          isEditMode={isEditMode}
          showEditToggle={!!accessToken && !!id}
          onToggleEditMode={() => setIsEditMode((prev) => !prev)}
          onMapClick={handleMapClick}
          onEditWaypoint={handleEditWaypoint}
          onDeleteWaypoint={handleDeleteWaypoint}
        />
      </Suspense>

      <WaypointFormModal
        open={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        initialValues={editingWaypoint ?? undefined}
        loading={isAdding || isEditing}
      />

      {weatherLoading && !weather && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Loading weather data...</p>
        </div>
      )}

      {weather && (
        <>
          {useCustomTime ? (
            <>
              <div style={{ width: '300px' }}>
                <label>Heure de départ</label>
                <TimePicker
                  format="HH:mm"
                  onChange={(value) =>
                    setDepartureTime(value?.toDate() ?? null)
                  }
                />
              </div>
              <div style={{ width: '300px' }}>
                <label>Vitesse moyenne (km/h)</label>
                <InputNumber
                  min={1}
                  defaultValue={50}
                  onChange={(value) => setSpeedKmh(value)}
                />
              </div>
            </>
          ) : (
            <TimeSelector
              weather={weather}
              setTimepointIndex={setTimepointIndex}
              timepointIndex={timepointIndex}
            />
          )}

          <Button
            onClick={() => {
              if (useCustomTime) {
                setDepartureTime(null)
                setSpeedKmh(50)
              }
              setUseCustomTime((prev) => !prev)
            }}
          >
            {useCustomTime
              ? "Choisir l'heure manuellement"
              : 'Utiliser heure de départ + vitesse'}
          </Button>

          <h3 className={styles.humidityPlot}>Humidity Chart</h3>

          <HumidityChart
            coordinates={parsed.coordinates}
            weather={weather}
            timepointIndex={timepointIndices ?? timepointIndex}
          />
        </>
      )}
    </div>
  )
}
