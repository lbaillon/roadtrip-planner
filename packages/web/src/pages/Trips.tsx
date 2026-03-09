import UserGreeting from "#web/components/UserGreeting";
import { useCreateTrip, useDeleteTrip, useGetTrips } from "#web/hooks/useTrips";
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from "antd";
export default function Trips() {
  const { data: trips } = useGetTrips()
  const { mutate: createTrip } = useCreateTrip()
  const { mutate: deleteTrip } = useDeleteTrip()
  return (
    <>
      <UserGreeting />
      <div style={{
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* <FontAwesomeIcon
          icon={faAdd}
          style={{ background: 'white' }}
          onClick={(e) => {
            e.stopPropagation()
            createTrip({ name: "On the road" })
          }}
        /> */}
        <Button type='primary' onClick={() => {
          createTrip({ name: "On the road" })
        }}>+</Button>
        {trips?.map(trip => (
          <div id={`trip-${trip.id}`}>
            <p>{trip.name}</p>
            <FontAwesomeIcon
              icon={faXmark}
              onClick={(e) => {
                e.stopPropagation()
                deleteTrip(trip.id)
              }}
            />
          </div>
        ))}
      </div>
    </ >
  )
}
