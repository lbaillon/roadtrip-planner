import AddTrackToTripModal from '#web/components/AddTrackToTripModal'
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
import { faArrowLeftLong, faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { GetTrackResponse } from '@roadtrip/shared'
import { useQueries } from '@tanstack/react-query'
import { lazy, Suspense, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useUpdateTrip } from '#web/hooks/mutations/useUpdateTrip'
import { Button, Collapse, Input, message } from 'antd'
import { useAuth } from '#web/hooks/useAuth'
import { faPencil } from '@fortawesome/free-solid-svg-icons'

const MapView = lazy(() => import('#web/components/MapView'))

export default function TripDetails() {
  const [userPosition, setUserPosition] = useState<{
    lat: number
    lon: number
  } | null>(null)
  const { id } = useParams()
  const { data: trip } = useGetTrip(id)
  const { data: tracks } = useGetTripTracks(id)
  const { mutate: removeTrackFromTrip } = useRemoveTrackFromTrip(id ?? '')
  const { mutate: updateTracksOrder } = useUpdateTripTracksOrder(id ?? '')
  const { mutate: updateTrip, isPending } = useUpdateTrip()
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(trip?.name ?? '')
  const [descriptionInput, setDescriptionInput] = useState(
    trip?.description ?? ''
  )
  const api = useApi()
  const { accessToken } = useAuth()

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

  const colorsById = Object.fromEntries(
    parsedTracks.map((track, index) => [
      track.id,
      TRACK_COLORS[index % TRACK_COLORS.length],
    ])
  )

  function handleRenameSubmit() {
    if (!id) return
    updateTrip(
      { id, name: nameInput, description: descriptionInput },
      {
        onSuccess: () => {
          setIsEditingName(false)
        },
        onError: () => {
          message.error("erreur lors de l'édition des infos du voyage")
        },
      }
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
            {accessToken && id && (
              <Button
                size="small"
                className={styles.button}
                onClick={(e) => {
                  e.stopPropagation()
                  setNameInput(trip?.name ?? '')
                  setDescriptionInput(trip?.description ?? '')
                  setIsEditingName(true)
                }}
              >
                <FontAwesomeIcon icon={faPencil} className={styles.icon} />
              </Button>
            )}
          </div>
          {isEditingName ? (
            <div className={styles.editTripInfo}>
              <Input
                className={styles.editNameInput}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                disabled={isPending}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit()
                  if (e.key === 'Escape') setIsEditingName(false)
                }}
              />
              <Input.TextArea
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                disabled={isPending}
              />
              <Button
                onClick={() => handleRenameSubmit()}
                className={styles.button}
              >
                <FontAwesomeIcon icon={faCheck} className={styles.icon} />
              </Button>
            </div>
          ) : (
            <Collapse
              ghost
              className={styles.description}
              items={[
                {
                  key: 'description',
                  label: 'Description',
                  children: trip?.description ?? 'Aucune description',
                },
              ]}
            />
          )}
        </div>
        <AddTrackToTripModal tripId={id} />
        <TracksList
          tracks={tracks ?? []}
          onDelete={removeTrackFromTrip}
          onReorder={updateTracksOrder}
          colorsById={colorsById}
        />
        {coordinates.length > 0 && (
          <Suspense fallback={<div>Chargement de la carte...</div>}>
            <div style={{ height: '400px', marginTop: '20px' }}>
              <MapView
                subTracks={subTracks}
                coordinates={coordinates}
                weather={[]}
                timepointIndex={[]}
                waypoints={[]}
                userPosition={userPosition}
                setUserPosition={setUserPosition}
              />
            </div>
          </Suspense>
        )}
      </Box>
    </>
  )
}
