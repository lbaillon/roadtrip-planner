import Box from '#web/components/Box'
import BoxTitle from '#web/components/BoxTitle'
import NewTripModal from '#web/components/NewTripModal'
import TripsList from '#web/components/TripsList'
import UserGreeting from '#web/components/UserGreeting'
import { useDeleteTrip, useGetTrips } from '#web/hooks/useTrips'
export default function Trips() {
  const { data: trips } = useGetTrips()
  const { mutate: deleteTrip } = useDeleteTrip()
  return (
    <>
      <UserGreeting />
      <Box>
        <BoxTitle>My trips</BoxTitle>
        <NewTripModal />
        <TripsList trips={trips ?? []} onDelete={deleteTrip} />
      </Box>
    </>
  )
}
