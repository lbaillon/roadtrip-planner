import Box from '#web/components/Box'
import BoxTitle from '#web/components/BoxTitle'
import NewTrackModal from '#web/components/NewTrackModal'
import TracksList from '#web/components/TracksList'
import UserGreeting from '#web/components/UserGreeting'
import { useDeleteTrack } from '#web/hooks/mutations/useDeleteTrack'
import { useGetTracks } from '#web/hooks/useTracks'
import { useGetSharedTracks } from '#web/hooks/useShares'

export default function Tracks() {
  const { data: tracks } = useGetTracks()
  const { data: sharedTracks } = useGetSharedTracks()
  const { mutate: deleteTrack } = useDeleteTrack()

  return (
    <>
      <UserGreeting />
      <NewTrackModal />
      <Box>
        <BoxTitle>Mes circuits</BoxTitle>
        <TracksList tracks={tracks ?? []} onDelete={deleteTrack} />
      </Box>
      {sharedTracks && sharedTracks.length > 0 && (
        <Box>
          <BoxTitle>Partagés avec moi</BoxTitle>
          <TracksList tracks={sharedTracks} />
        </Box>
      )}
    </>
  )
}
