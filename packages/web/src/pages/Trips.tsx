import Box from '#web/components/Box'
import BoxTitle from '#web/components/BoxTitle'
import NewTripModal from '#web/components/NewTripModal'
import TripsList from '#web/components/TripsList'
import UserGreeting from '#web/components/UserGreeting'
import { useDeleteTrip } from '#web/hooks/mutations/useDeleteTrip'
import { useGetTrips } from '#web/hooks/useTrips'
import { useGetSharedTrips, useLeaveSharedTrip } from '#web/hooks/useShares'
import { Divider } from 'antd'
export default function Trips() {
  const { data: trips } = useGetTrips()
  const { data: sharedTrips } = useGetSharedTrips()
  const { mutate: deleteTrip } = useDeleteTrip()
  const { mutate: leaveSharedTrip } = useLeaveSharedTrip()
  return (
    <>
      <UserGreeting />
      <Box>
        <BoxTitle>Mes voyages</BoxTitle>
        <NewTripModal />
        <TripsList trips={trips ?? []} onDelete={deleteTrip} />
        {sharedTrips && sharedTrips.length > 0 && (
          <>
            <Divider style={{ marginTop: 32 }} />
            <BoxTitle>Partagés avec moi</BoxTitle>
            <TripsList trips={sharedTrips} onDelete={leaveSharedTrip} />
          </>
        )}
      </Box>
    </>
  )
}
