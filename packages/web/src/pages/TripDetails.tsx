import AddTrackToTripModal from "#web/components/AddTrackToTripModal";
import Box from "#web/components/Box";
import BoxTitle from "#web/components/BoxTitle";
import TracksList from "#web/components/TracksList";
import UserGreeting from "#web/components/UserGreeting";
import { useGetTrip, useGetTripTracks, useRemoveTrackFromTrip } from "#web/hooks/useTrips";
import { faArrowLeftLong } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useParams } from "react-router-dom";

export default function TripDetails() {
  const { id } = useParams()
  const { data: trip } = useGetTrip(id)
  const { data: tracks } = useGetTripTracks(id)
  const { mutate: removeTrackFromTrip } = useRemoveTrackFromTrip(id ?? '')

  return (
    <>
      <UserGreeting />
      <Box>
        <div style={{display:'flex' , gap:'10px'}}><Link to={'/trips'}>
          <FontAwesomeIcon
            icon={faArrowLeftLong}
            onClick={(e) => {
              e.stopPropagation()
            }}
          />
        </Link>
        <BoxTitle>{trip?.name ?? 'No trip found'}</BoxTitle>
        </div>
        <AddTrackToTripModal tripId={id} />
        <TracksList tracks={tracks ?? []} onDelete={removeTrackFromTrip} />
      </Box>
    </ >
  )
}