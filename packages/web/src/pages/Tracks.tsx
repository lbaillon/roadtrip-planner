import Box from '#web/components/Box'
import BoxTitle from '#web/components/BoxTitle'
import NewTrackModal from '#web/components/NewTrackModal'
import TracksList from '#web/components/TracksList'
import UserGreeting from '#web/components/UserGreeting'
import { useDeleteTrack, useGetTracks } from '#web/hooks/useTracks'
import { faMotorcycle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'

export default function Tracks() {
  const { data: tracks } = useGetTracks()
  const { mutate: deleteTrack } = useDeleteTrack()

  return (
    <>
      <UserGreeting />
      <NewTrackModal />
      <Box>
        <BoxTitle>My tracks</BoxTitle>
        <TracksList tracks={tracks??[]} onDelete={deleteTrack}/>
      </Box>
    </>
  )
}
