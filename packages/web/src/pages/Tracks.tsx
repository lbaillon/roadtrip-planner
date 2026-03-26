import Box from '#web/components/Box'
import BoxTitle from '#web/components/BoxTitle'
import NewTrackModal from '#web/components/NewTrackModal'
import TracksList from '#web/components/TracksList'
import UserGreeting from '#web/components/UserGreeting'
import { useDeleteTrack } from '#web/hooks/mutations/useDeleteTrack'
import { useGetTracks } from '#web/hooks/useTracks'

export default function Tracks() {
  const { data: tracks } = useGetTracks()
  const { mutate: deleteTrack } = useDeleteTrack()

  return (
    <>
      <UserGreeting />
      <NewTrackModal />
      <Box>
        <BoxTitle>My tracks</BoxTitle>
        <TracksList tracks={tracks ?? []} onDelete={deleteTrack} />
      </Box>
    </>
  )
}
