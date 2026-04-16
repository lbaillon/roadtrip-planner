import AddTrackToTripModal from '#web/components/AddTrackToTripModal'
import Box from '#web/components/Box'
import BoxTitle from '#web/components/BoxTitle'
import TracksList from '#web/components/TracksList'
import UserGreeting from '#web/components/UserGreeting'
import { useRemoveTrackFromTrip } from '#web/hooks/mutations/useRemoveTrackFromTrip'
import { useUpdateTripTracksOrder } from '#web/hooks/mutations/useReorderTripTracks'
import { useApi } from '#web/hooks/useApi'
import { useGetTrip, useGetTripTracks } from '#web/hooks/useTrips'
import { parseGpxFile } from '#web/lib/gpx-utils'
import { faArrowLeftLong } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { GetTrackResponse } from '@roadtrip/shared'
import { useQueries } from '@tanstack/react-query'
import { lazy, Suspense, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

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
  const api = useApi()

  const trackQueries = useQueries({
    queries: (tracks ?? []).map((track) => ({
      queryKey: ['tracks', track.id],
      queryFn: () => api<GetTrackResponse>(`/api/tracks/${track.id}`),
      gcTime: 7 * 24 * 60 * 60 * 1000,
      staleTime: Infinity,
    })),
  })

  const parsedTracks = useMemo(() => {
    return (tracks ?? [])
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
  }, [tracks, trackQueries])

  const subTracks = parsedTracks.map((track) => ({
    name: track.parsedGpx.name ?? '',
    coordinates: track.parsedGpx.coordinates,
  }))

  const coordinates = parsedTracks.flatMap((track) => track.parsedGpx.coordinates)


  return (
    <>
      <UserGreeting />
      <Box>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to={'/trips'}>
            <FontAwesomeIcon icon={faArrowLeftLong} />
          </Link>
          <BoxTitle>{trip?.name ?? 'No trip found'}</BoxTitle>
        </div>
        <AddTrackToTripModal tripId={id} />
        <TracksList
          tracks={tracks ?? []}
          onDelete={removeTrackFromTrip}
          onReorder={updateTracksOrder}
        />
        {coordinates.length > 0 && (
          <Suspense fallback={<div>Chargement de la carte...</div>}>
            <div style={{ height: '400px', marginTop: '20px'}}>
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
