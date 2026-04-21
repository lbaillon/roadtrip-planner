import { HumidityChart } from '#web/components/HumidityChart'
import { TimeSelector } from '#web/components/TimeSelector'
import WaypointFormModal from '#web/components/WaypointFormModal'
import {
  useAddWaypoint,
  useDeleteWaypoint,
  useEditWaypoint,
  useInvertTrack,
  useRenameTrack,
} from '#web/hooks/mutations/usePutTrackGpx'
import { useGetWeather } from '#web/hooks/useApi'
import { useAuth } from '#web/hooks/useAuth'
import {
  remapCoordinatesFrom,
  sampleRoutePointsWithCumulativeKm,
} from '#web/lib/gpx-utils'
import type { ParsedGpx } from '@roadtrip/shared'
import { Button, Collapse, Input, InputNumber, message, TimePicker } from 'antd'
import { lazy, Suspense, useState } from 'react'
import { useParams } from 'react-router-dom'
import styles from './TrackContent.module.css'
import { TRACK_COLORS } from './MapViewTracksColors'
import { ElevationChart } from './ElevationChart'
import { WindSpeedChart } from './WindSpeedChart'

const MapView = lazy(() => import('#web/components/MapView'))
type WaypointFormData = { name: string; description?: string }
type EditingWaypoint = { index: number } & WaypointFormData

export default function TrackContent({
  parsed,
  headerAction,
}: {
  trackName?: string
  parsed: ParsedGpx
  headerAction?: React.ReactNode
}) {
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
  const [userPosition, setUserPosition] = useState<{
    lat: number
    lon: number
  } | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
const [nameInput, setNameInput] = useState(parsed.name ?? '')

  const [messageApi, contextHolder] = message.useMessage()
  const { id } = useParams()
  const { accessToken } = useAuth()

  const actualCoords = userPosition
    ? remapCoordinatesFrom(parsed.coordinates, userPosition)
    : parsed.coordinates

  const sampledWithKm = sampleRoutePointsWithCumulativeKm(
    actualCoords,
    parsed.distance / 1000
  )

  const {
    data: weather,
    isPending: weatherLoading,
    isError,
    error,
  } = useGetWeather({ coordinates: sampledWithKm })

  const { mutate: addWaypoint, isPending: isAdding } = useAddWaypoint(id ?? '')
  const { mutate: editWaypoint, isPending: isEditing } = useEditWaypoint(
    id ?? ''
  )
  const { mutate: deleteWaypoint } = useDeleteWaypoint(id ?? '')
  const { mutate: invertTrack, isPending: isInverting } = useInvertTrack(
    id ?? ''
  )
  const { mutate: renameTrack, isPending: isRenaming } = useRenameTrack(id ?? '')

  const getTimepointIndices = () => {
    if (!departureTime || !speedKmh || !weather || !parsed) return null

    const departureMs = departureTime.getTime()

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
  }

  const remainingDistanceKm =
    sampledWithKm.length > 0
      ? sampledWithKm[sampledWithKm.length - 1].cumulativeKm
      : parsed.distance / 1000

  const arrivalTime =
    departureTime && speedKmh && remainingDistanceKm
      ? new Date(
          departureTime.getTime() +
            (remainingDistanceKm / speedKmh) * 3600 * 1000
        )
      : null

  const timepointIndices = getTimepointIndices()

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
      onError: () => messageApi.error('Erreur lors de la suppression du point'),
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
          onError: () =>
            messageApi.error('Erreur lors de la modification du point'),
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
          onError: () => messageApi.error("Erreur lors de l'ajout du point"),
        }
      )
    }
  }

  function handleModalClose() {
    setIsModalOpen(false)
    setEditingWaypoint(null)
    setPendingClickCoords(null)
  }

  function handleRenameSubmit() {
    renameTrack(nameInput , {
      onSuccess: () => {
        setIsEditingName(false)
      },
      onError : () => {
        messageApi.error('Erreur lors de l\'édition')
      }
    })
  }

  return (
    <div className={styles.mapBox}>
      {contextHolder}
      {isEditingName ? (
        <Input value={nameInput} onChange={e => setNameInput(e.target.value)} disabled={isRenaming} autoFocus onKeyDown={e => {
  if (e.key === 'Enter') handleRenameSubmit()
  if (e.key === 'Escape') setIsEditingName(false)
}}/>
      ) : (
      <>
      <h2 className={styles.routeName}>{parsed.name ?? 'Route inconnue'}</h2>
      {accessToken && id && <Button onClick={() => { 
        setNameInput(parsed.name ?? '') 
        setIsEditingName(true)}}>✏️</Button>}
      </>
      )}
      <div className={styles.mapHeader}>
        {parsed.distance && (
          <p className={styles.routeName}>
            Distance : {(parsed.distance / 1000).toFixed(2)} km
          </p>
        )}
        {accessToken && id && (
          <Button
            onClick={() =>
              invertTrack(undefined, {
                onError: () =>
                  messageApi.error("Erreur lors de l'inversion du parcours"),
              })
            }
            loading={isInverting}
          >
            Inverser départ et arrivée
          </Button>
        )}
        {arrivalTime && (
          <p className={styles.routeName}>
            Arrivée estimée :{' '}
            {arrivalTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
        {headerAction}
      </div>
      {weatherLoading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Chargement de la météo...</p>
        </div>
      )}
      {isError && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Erreur : {error.message}</p>
        </div>
      )}
      <Suspense fallback={<div>Chargement de la carte...</div>}>
        <MapView
          coordinates={parsed.coordinates}
          subTracks={parsed.subTracks}
          weather={weather ?? []}
          timepointIndex={
            timepointIndices ??
            new Array(parsed.coordinates.length).fill(timepointIndex)
          }
          waypoints={parsed.waypoints}
          isEditMode={isEditMode}
          showEditToggle={!!accessToken && !!id}
          onToggleEditMode={() => setIsEditMode((prev) => !prev)}
          onMapClick={handleMapClick}
          onEditWaypoint={handleEditWaypoint}
          onDeleteWaypoint={handleDeleteWaypoint}
          userPosition={userPosition}
          setUserPosition={setUserPosition}
        />
      </Suspense>

      {parsed.subTracks.length > 1 && (
        <Collapse
          items={[
            {
              key: 'legend',
              label: 'Légende',
              children: parsed.subTracks.map((st, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '6px',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '4px',
                      backgroundColor:
                        TRACK_COLORS[index % TRACK_COLORS.length],
                      borderRadius: '2px',
                      flexShrink: 0,
                    }}
                  />
                  <span>{st.name}</span>
                </div>
              )),
            },
          ]}
        />
      )}
      <WaypointFormModal
        open={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        initialValues={editingWaypoint ?? undefined}
        loading={isAdding || isEditing}
      />

      {weatherLoading && !weather && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Chargement de la météo...</p>
        </div>
      )}

      {weather && (
        <>
          {useCustomTime ? (
            <div className={styles.startAndSpeed}>
              <div className={styles.selectionBox}>
                <label>Heure de départ</label>
                <TimePicker
                  format="HH:mm"
                  onChange={(value) =>
                    setDepartureTime(value?.toDate() ?? null)
                  }
                />
              </div>
              <div className={styles.selectionBox}>
                <label>Vitesse moyenne (km/h)</label>
                <InputNumber
                  min={1}
                  defaultValue={50}
                  onChange={(value) => setSpeedKmh(value)}
                />
              </div>
            </div>
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
            className={styles.hourSetup}
          >
            {useCustomTime
              ? 'Choisir un créneau'
              : 'Heure et vitesse personnalisées'}
          </Button>

          {parsed.coordinates.some((c) => c.ele != null) && (
            <h3 className={styles.humidityPlot}>Altitude</h3>
          )}
          <ElevationChart coordinates={actualCoords} />

          <h3 className={styles.humidityPlot}>Taux d'humidité</h3>

          <HumidityChart
            coordinates={actualCoords}
            weather={weather}
            timepointIndex={
              timepointIndices ??
              new Array(parsed.coordinates.length).fill(timepointIndex)
            }
          />
          <h3 className={styles.humidityPlot}>Vitesse du vent</h3>

          <WindSpeedChart
            coordinates={actualCoords}
            weather={weather}
            timepointIndex={
              timepointIndices ??
              new Array(parsed.coordinates.length).fill(timepointIndex)
            }
          />
        </>
      )}
    </div>
  )
}
