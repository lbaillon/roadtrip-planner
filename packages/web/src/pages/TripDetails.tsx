import AddTrackToTripModal from '#web/components/AddTrackToTripModal'
import AuthRequiredNotice from '#web/components/AuthRequiredNotice'
import Box from '#web/components/Box'
import styles from './TripDetails.module.css'
import TracksList from '#web/components/TracksList'
import UserGreeting from '#web/components/UserGreeting'
import { useRemoveTrackFromTrip } from '#web/hooks/mutations/useRemoveTrackFromTrip'
import { useUpdateTripTracksOrder } from '#web/hooks/mutations/useReorderTripTracks'
import { useApi } from '#web/hooks/useApi'
import { useGetTrip, useGetTripTracks } from '#web/hooks/useTrips'
import { TRACK_COLORS } from '#web/components/MapViewTracksColors'
import { parseGpxFile } from '#web/lib/gpx-utils'
import {
  faArrowLeftLong,
  faGlobe,
  faLock,
  faPencil,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { GetTrackResponse } from '@roadtrip/shared'
import { useQueries } from '@tanstack/react-query'
import { lazy, Suspense, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useUpdateTrip } from '#web/hooks/mutations/useUpdateTrip'
import { useUpdateTripVisibility } from '#web/hooks/mutations/useUpdateTripVisibility'
import { Button, Collapse, Input, Modal, Switch, message } from 'antd'
import { useAuth } from '#web/hooks/useAuth'
import ShareSection from '#web/components/ShareSection'
import TripParticipants from '#web/components/TripParticipants'
import { useGetTripShares, useShareTrip } from '#web/hooks/useShares'

const MapView = lazy(() => import('#web/components/MapView'))

export default function TripDetails() {
  const [userPosition, setUserPosition] = useState<{
    lat: number
    lon: number
  } | null>(null)
  const { id } = useParams()
  const { data: trip, isError } = useGetTrip(id)
  const { data: tracks } = useGetTripTracks(id)
  const { mutate: removeTrackFromTrip } = useRemoveTrackFromTrip(id ?? '')
  const { mutate: updateTracksOrder } = useUpdateTripTracksOrder(id ?? '')
  const { mutate: updateTrip, isPending } = useUpdateTrip()
  const { mutate: updateVisibility } = useUpdateTripVisibility()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [nameInput, setNameInput] = useState(trip?.name ?? '')
  const [descriptionInput, setDescriptionInput] = useState(
    trip?.description ?? ''
  )
  const api = useApi()
  const { accessToken } = useAuth()
  const { data: tripShares } = useGetTripShares(id, isEditModalOpen)
  const { mutate: shareTrip, isPending: isSharing } = useShareTrip(id ?? '')

  const trackQueries = useQueries({
    queries: (tracks ?? []).map((track) => ({
      queryKey: ['tracks', track.id],
      queryFn: () => api<GetTrackResponse>(`/api/tracks/${track.id}`),
      gcTime: 7 * 24 * 60 * 60 * 1000,
      staleTime: Infinity,
    })),
  })

  const parsedTracks = (tracks ?? [])
    .map((track, index) => {
      const gpxContent = trackQueries[index]?.data?.gpxContent
      if (!gpxContent) return null
      try {
        return { id: track.id, parsedGpx: parseGpxFile(gpxContent) }
      } catch {
        return null
      }
    })
    .filter(
      (t): t is NonNullable<typeof t> =>
        t !== null && t.parsedGpx.coordinates.length > 0
    )

  const subTracks = parsedTracks.map((track) => ({
    name: track.parsedGpx.name ?? '',
    coordinates: track.parsedGpx.coordinates,
  }))

  const coordinates = parsedTracks.flatMap(
    (track) => track.parsedGpx.coordinates
  )

  const totalDistanceKm =
    parsedTracks.reduce((sum, track) => sum + track.parsedGpx.distance, 0) /
    1000

  const colorsById = Object.fromEntries(
    parsedTracks.map((track, index) => [
      track.id,
      TRACK_COLORS[index % TRACK_COLORS.length],
    ])
  )

  function openEditModal() {
    setNameInput(trip?.name ?? '')
    setDescriptionInput(trip?.description ?? '')
    setIsEditModalOpen(true)
  }

  function handleRenameSubmit() {
    if (!id) return
    updateTrip(
      { id, name: nameInput, description: descriptionInput },
      {
        onSuccess: () => {
          setIsEditModalOpen(false)
        },
        onError: () => {
          message.error("erreur lors de l'édition des infos du voyage")
        },
      }
    )
  }

  if (!accessToken && isError) {
    return (
      <>
        <UserGreeting />
        <Box>
          <AuthRequiredNotice resource="voyage" />
        </Box>
      </>
    )
  }

  return (
    <>
      <UserGreeting />
      <Box>
        <div className={styles.content}>
          <div className={styles.tripHeader}>
            <Link to={'/trips'}>
              <Button className={styles.button}>
                <FontAwesomeIcon
                  icon={faArrowLeftLong}
                  className={styles.icon}
                />
              </Button>
            </Link>
            <h2 className={styles.tripName}>
              {trip?.name ?? 'Route inconnue'}
            </h2>
            {accessToken && id && trip?.isOwner && (
              <Button
                size="small"
                className={styles.button}
                onClick={openEditModal}
              >
                <FontAwesomeIcon icon={faPencil} className={styles.icon} />
              </Button>
            )}
          </div>

          {accessToken && id && (
            <span
              className={`${styles.badge} ${trip?.isPublic ? styles.badgePublic : styles.badgePrivate}`}
            >
              <FontAwesomeIcon icon={trip?.isPublic ? faGlobe : faLock} />
              {trip?.isPublic ? 'Public' : 'Privé'}
            </span>
          )}

          {!trip?.isOwner && trip?.sharedBy && (
            <p style={{ opacity: 0.7 }}>Partagé par {trip.sharedBy}</p>
          )}

          {totalDistanceKm > 0 && (
            <p className={styles.tripDistance}>
              Distance totale : {totalDistanceKm.toFixed(2)} km
            </p>
          )}

          <Collapse
            ghost
            className={styles.description}
            items={[
              {
                key: 'description',
                label: 'Description',
                children: (
                  <>
                    <p>{trip?.description ?? 'Aucune description'}</p>
                    <TripParticipants tripId={id} />
                  </>
                ),
              },
            ]}
          />
        </div>

        <TracksList
          tracks={tracks ?? []}
          onDelete={trip?.isOwner ? removeTrackFromTrip : undefined}
          onReorder={trip?.isOwner ? updateTracksOrder : undefined}
          colorsById={colorsById}
        />
        {trip?.isOwner && <AddTrackToTripModal tripId={id} />}

        {coordinates.length > 0 && (
          <Suspense fallback={<div>Chargement de la carte...</div>}>
            <MapView
              subTracks={subTracks}
              coordinates={coordinates}
              weather={[]}
              timepointIndex={[]}
              waypoints={[]}
              userPosition={userPosition}
              setUserPosition={setUserPosition}
              style={{ width: '100%', margin: '20px auto 0' }}
            />
          </Suspense>
        )}

        <Modal
          title="Modifier le voyage"
          open={isEditModalOpen}
          onCancel={() => setIsEditModalOpen(false)}
          onOk={handleRenameSubmit}
          okText="Enregistrer"
          cancelText="Annuler"
          confirmLoading={isPending}
        >
          <div className={styles.modalContent}>
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              disabled={isPending}
              placeholder="Nom du voyage"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit()
              }}
            />
            <Input.TextArea
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              disabled={isPending}
              placeholder="Description"
            />
            <div className={styles.modalVisibility}>
              <Switch
                size="small"
                checked={trip?.isPublic}
                onChange={(checked) =>
                  id && updateVisibility({ id, isPublic: checked })
                }
                checkedChildren="Public"
                unCheckedChildren="Privé"
              />
              <span className={styles.modalVisibilityLabel}>
                {trip?.isPublic ? 'Voyage public' : 'Voyage privé'}
              </span>
            </div>
            <ShareSection
              shares={tripShares}
              isSharing={isSharing}
              onShare={(emails) =>
                shareTrip(emails, {
                  onSuccess: () => message.success('Voyage partagé'),
                  onError: () => message.error('Erreur lors du partage'),
                })
              }
            />
          </div>
        </Modal>
      </Box>
    </>
  )
}
