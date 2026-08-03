import { TimeSelector } from '#web/components/TimeSelector'
import WaypointFormModal from '#web/components/WaypointFormModal'
import {
  useAddWaypoint,
  useDeleteWaypoint,
  useEditWaypoint,
  useInvertTrack,
  useRenameTrack,
} from '#web/hooks/mutations/usePutTrackGpx'
import { useUpdateTrackVisibility } from '#web/hooks/mutations/useUpdateTrackVisibility'
import ShareSection from '#web/components/ShareSection'
import { useGetTrackShares, useShareTrack } from '#web/hooks/useShares'
import { useGetWeather } from '#web/hooks/useApi'
import { useAuth } from '#web/hooks/useAuth'
import { useGetTrackVisibility } from '#web/hooks/useTracks'
import {
  remapCoordinatesFrom,
  sampleRoutePointsWithCumulativeKm,
} from '#web/lib/gpx-utils'
import type { ParsedGpx } from '@roadtrip/shared'
import {
  Button,
  Collapse,
  Input,
  InputNumber,
  message,
  Modal,
  Switch,
  TimePicker,
} from 'antd'
import { lazy, Suspense, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './TrackContent.module.css'
import { TRACK_COLORS } from './MapViewTracksColors'
import { TrackCharts } from './TrackCharts'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeftLong,
  faGlobe,
  faLock,
  faPencil,
} from '@fortawesome/free-solid-svg-icons'

const MapView = lazy(() => import('#web/components/MapView'))
type WaypointFormData = { name: string; description?: string }
type EditingWaypoint = { index: number } & WaypointFormData

export default function TrackContent({
  parsed,
  headerAction,
  isPublic,
  isOwner,
  routeColor,
  sharedBy,
}: {
  trackName?: string
  parsed: ParsedGpx
  headerAction?: React.ReactNode
  isPublic?: boolean
  isOwner?: boolean
  routeColor?: string
  sharedBy?: string
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
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false)
  const [nameInput, setNameInput] = useState(parsed.name ?? '')

  const [messageApi, contextHolder] = message.useMessage()
  const { id } = useParams()
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const { data: visibility } = useGetTrackVisibility(id, !!isOwner)
  const publicViaTrip = !isPublic ? (visibility?.publicViaTrip ?? null) : null

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
  const { mutate: renameTrack, isPending: isRenaming } = useRenameTrack(
    id ?? ''
  )
  const { mutate: updateVisibility } = useUpdateTrackVisibility()
  const { data: trackShares } = useGetTrackShares(id, isEditNameModalOpen)
  const { mutate: shareTrack, isPending: isSharing } = useShareTrack(id ?? '')

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
    renameTrack(nameInput, {
      onSuccess: () => {
        setIsEditNameModalOpen(false)
      },
      onError: () => {
        messageApi.error("Erreur lors de l'édition")
      },
    })
  }

  return (
    <div className={styles.mapBox}>
      {contextHolder}
      <div className={styles.nameBox}>
        <Button className={styles.backButton} onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeftLong} className={styles.icon} />
        </Button>
        <h2 className={styles.routeName}>{parsed.name ?? 'Route inconnue'}</h2>
        {accessToken && id && isOwner ? (
          <Button
            size="small"
            className={styles.backButton}
            onClick={() => {
              setNameInput(parsed.name ?? '')
              setIsEditNameModalOpen(true)
            }}
          >
            <FontAwesomeIcon icon={faPencil} className={styles.icon} />
          </Button>
        ) : (
          <div className={styles.headerSpacer} />
        )}
      </div>
      {!isOwner && sharedBy && (
        <p style={{ opacity: 0.7, textAlign: 'center' }}>
          Partagé par {sharedBy}
        </p>
      )}
      {accessToken && id && (
        <div className={styles.badgeWrapper}>
          <span
            className={`${styles.badge} ${isPublic || publicViaTrip ? styles.badgePublic : styles.badgePrivate}`}
          >
            <FontAwesomeIcon
              icon={isPublic || publicViaTrip ? faGlobe : faLock}
            />
            {isPublic
              ? 'Public'
              : publicViaTrip
                ? `Public via ${publicViaTrip}`
                : 'Privé'}
          </span>
        </div>
      )}
      <div className={styles.mapHeader}>
        {parsed.distance && (
          <p className={styles.routeName}>
            Distance : {(parsed.distance / 1000).toFixed(2)} km
          </p>
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
        <div className={styles.invertAndDownload}>
          {headerAction}

          {accessToken && id && isOwner && (
            <Button
              className={styles.invertButton}
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
        </div>
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
          showEditToggle={!!accessToken && !!id && !!isOwner}
          onToggleEditMode={() => setIsEditMode((prev) => !prev)}
          onMapClick={handleMapClick}
          onEditWaypoint={handleEditWaypoint}
          onDeleteWaypoint={handleDeleteWaypoint}
          userPosition={userPosition}
          setUserPosition={setUserPosition}
          routeColor={routeColor}
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

          <h3 className={styles.humidityPlot}>Profil du circuit</h3>

          <TrackCharts
            coordinates={actualCoords}
            weather={weather}
            timepointIndex={
              timepointIndices ??
              new Array(parsed.coordinates.length).fill(timepointIndex)
            }
          />
        </>
      )}

      <Modal
        title="Modifier le circuit"
        open={isEditNameModalOpen}
        onCancel={() => setIsEditNameModalOpen(false)}
        onOk={handleRenameSubmit}
        okText="Enregistrer"
        cancelText="Annuler"
        confirmLoading={isRenaming}
      >
        <div className={styles.editModalContent}>
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            disabled={isRenaming}
            placeholder="Nom du circuit"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit()
            }}
          />
          <div className={styles.modalVisibility}>
            <Switch
              size="small"
              checked={isPublic}
              onChange={(checked) =>
                id && updateVisibility({ id, isPublic: checked })
              }
              checkedChildren="Public"
              unCheckedChildren="Privé"
            />
            <span className={styles.modalVisibilityLabel}>
              {isPublic ? 'Circuit public' : 'Circuit privé'}
            </span>
          </div>
          <ShareSection
            shares={trackShares}
            isSharing={isSharing}
            onShare={(emails) =>
              shareTrack(emails, {
                onSuccess: () => messageApi.success('Circuit partagé'),
                onError: () => messageApi.error('Erreur lors du partage'),
              })
            }
          />
        </div>
      </Modal>
    </div>
  )
}
