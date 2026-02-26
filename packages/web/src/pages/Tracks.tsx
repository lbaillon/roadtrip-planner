import NewTrackModal from "#web/components/NewTrackModal";
import UserGreeting from "#web/components/UserGreeting";
import UserTracks from "#web/components/UserTracks";


export default function Tracks() {

  return(
    <>
      <UserGreeting/>
      <NewTrackModal/>
      <UserTracks/>
    </>
  )
}