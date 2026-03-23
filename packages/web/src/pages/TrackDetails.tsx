import { HumidityChart } from '#web/components/HumidityChart'
import { TimeSelector } from '#web/components/TimeSelector'
import WaypointFormModal from '#web/components/WaypointFormModal'
import { useAuth } from '#web/hooks/useAuth'
import {
  useAddWaypoint,
  useDeleteWaypoint,
  useEditWaypoint,
  useGetParsedTrack,
  useGetTrack,
  useGetTrackWeather,
} from '#web/hooks/useTracks'
import { Button, InputNumber, message, TimePicker } from 'antd'
import { Suspense, lazy, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import styles from './TrackDetails.module.css'
import { sampleRoutePointsWithCumulativeKm } from '#web/lib/gpx-utils'

const MapView = lazy(() => import('#web/components/MapView'))

type WaypointFormData = { name: string; description?: string }
type EditingWaypoint = { index: number } & WaypointFormData

export default function TrackDetails() {
  const [timepointIndex, setTimepointIndex] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingClickCoords, setPendingClickCoords] = useState<{
    lat: number
    lon: number
  } | null>(null)
  const [editingWaypoint, setEditingWaypoint] =
    useState<EditingWaypoint | null>(null)
  const [departureTime, setDepartureTime] = useState<Date | null>(null)
  const [speedKmh, setSpeedKmh] = useState<number | null>(50)

  const [messageApi, contextHolder] = message.useMessage()
  const { id } = useParams()
  const { accessToken } = useAuth()

  const { data: track } = useGetTrack(id)
  const { data: parsed, isLoading: parsedLoading } = useGetParsedTrack(id)
  const { data: weather, isLoading: weatherLoading } = useGetTrackWeather(id)

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
    const estimatedMs = departureMs + (point.cumulativeKm / speedKmh) * 3600 * 1000
    const estimatedSec = estimatedMs / 1000
    const timepoints = weather[i]?.timepoints ?? []
    return timepoints.reduce(
      (bestIdx, tp, idx) =>
        Math.abs(tp.time - estimatedSec) < Math.abs(timepoints[bestIdx].time - estimatedSec)
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

  function handleDownload() {
    if (!track) return
    const blob = new Blob([track.gpxContent], { type: 'application/gpx+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${track.name}.gpx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.contentBox}>
      {contextHolder}
      {parsedLoading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Loading route...</p>
        </div>
      )}

      {parsed && (
        <div className={styles.mapBox}>
          <h2 className={styles.routeName}>{parsed.name}</h2>
          {parsed.distance && (
            <p className={styles.routeName}>
              Distance: {(parsed.distance / 1000).toFixed(2)} km
            </p>
          )}
          <div className={styles.speedAndTime}>
            <label>Heure de départ</label>
            <TimePicker onChange={(value)=>setDepartureTime(value?.toDate()??null)} format = 'HH:mm'/>
          </div>
          <div className={styles.speedAndTime}>
            <label>Vitesse moyenne (km/h)</label>
            <InputNumber min={1} defaultValue={50} onChange={(value) => setSpeedKmh(value)} />
          </div>

          <div className={styles.trackActions}>
            <Button onClick={handleDownload}>Download GPX</Button>
          </div>

          <Suspense fallback={<div>Loading map...</div>}>
            <MapView
              coordinates={parsed.coordinates}
              weather={weather ?? []}
              timepointIndex={timepointIndices ?? timepointIndex}
              waypoints={parsed.waypoints}
              isEditMode={isEditMode}
              showEditToggle={!!accessToken}
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
              <TimeSelector
                weather={weather}
                setTimepointIndex={setTimepointIndex}
                timepointIndex={timepointIndex}
              />

              <h3 className={styles.humidityPlot}>Humidity Chart</h3>

              <HumidityChart
                coordinates={parsed.coordinates}
                weather={weather}
                timepointIndex={timepointIndex}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
