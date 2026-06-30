import Box from '#web/components/Box'
import BoxTitle from '#web/components/BoxTitle'
import NewTripModal from '#web/components/NewTripModal'
import TripsList from '#web/components/TripsList'
import UserGreeting from '#web/components/UserGreeting'
import { useDeleteTrip } from '#web/hooks/mutations/useDeleteTrip'
import { useGetTrips } from '#web/hooks/useTrips'
import { useGetSharedTrips } from '#web/hooks/useShares'
export default function Trips() {
  const { data: trips } = useGetTrips()
  const { data: sharedTrips } = useGetSharedTrips()
  const { mutate: deleteTrip } = useDeleteTrip()
  return (
    <>
      <UserGreeting />
      <Box>
        <BoxTitle>Mes voyages</BoxTitle>
        <NewTripModal />
        <TripsList trips={trips ?? []} onDelete={deleteTrip} />
      </Box>
      {sharedTrips && sharedTrips.length > 0 && (
        <Box>
          <BoxTitle>Partagés avec moi</BoxTitle>
          <TripsList trips={sharedTrips} />
        </Box>
      )}
    </>
  )
}
