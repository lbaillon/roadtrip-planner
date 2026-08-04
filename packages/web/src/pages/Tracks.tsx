import Box from '#web/components/Box'
import BoxTitle from '#web/components/BoxTitle'
import NewTrackModal from '#web/components/NewTrackModal'
import TracksList from '#web/components/TracksList'
import UserGreeting from '#web/components/UserGreeting'
import { useDeleteTrack } from '#web/hooks/mutations/useDeleteTrack'
import { useGetTracks } from '#web/hooks/useTracks'
import { useGetSharedTracks, useLeaveSharedTrack } from '#web/hooks/useShares'
import { Button, Divider, Dropdown } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'

type TrackFilter = 'all' | 'inTrip' | 'notInTrip'

const FILTER_LABELS: Record<TrackFilter, string> = {
  all: 'Tous',
  inTrip: 'Dans un voyage',
  notInTrip: 'Hors voyage',
}

export default function Tracks() {
  const { data: tracks } = useGetTracks()
  const { data: sharedTracks } = useGetSharedTracks()
  const { mutate: deleteTrack } = useDeleteTrack()
  const { mutate: leaveSharedTrack } = useLeaveSharedTrack()
  const [filter, setFilter] = useState<TrackFilter>('all')

  const filteredTracks = (tracks ?? []).filter((track) => {
    if (filter === 'inTrip') return track.inTrip
    if (filter === 'notInTrip') return !track.inTrip
    return true
  })

  return (
    <>
      <UserGreeting />
      <NewTrackModal />
      <Box>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <BoxTitle>Mes traces</BoxTitle>
          <Dropdown
            trigger={['click']}
            menu={{
              selectable: true,
              selectedKeys: [filter],
              onClick: ({ key }) => setFilter(key as TrackFilter),
              items: [
                { key: 'all', label: 'Tous' },
                { key: 'inTrip', label: 'Dans un voyage' },
                { key: 'notInTrip', label: 'Hors voyage' },
              ],
            }}
          >
            <Button>
              Filtrer : {FILTER_LABELS[filter]}{' '}
              <FontAwesomeIcon icon={faChevronDown} />
            </Button>
          </Dropdown>
        </div>
        <TracksList tracks={filteredTracks} onDelete={deleteTrack} />
        {sharedTracks && sharedTracks.length > 0 && (
          <>
            <Divider style={{ marginTop: 32 }} />
            <BoxTitle>Partagées avec moi</BoxTitle>
            <TracksList tracks={sharedTracks} onDelete={leaveSharedTrack} />
          </>
        )}
      </Box>
    </>
  )
}
