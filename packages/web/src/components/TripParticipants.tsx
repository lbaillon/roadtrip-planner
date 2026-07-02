import { useGetTripParticipants } from '#web/hooks/useShares'
import type { ParticipationStatus } from '@roadtrip/shared'
import { Avatar, Tooltip } from 'antd'

const STATUS_COLOR: Record<ParticipationStatus, string> = {
  accepted: '#52c41a',
  declined: '#ff4d4f',
  pending: '#faad14',
}

const STATUS_LABEL: Record<ParticipationStatus, string> = {
  accepted: 'Participe',
  declined: 'Ne participe pas',
  pending: 'En attente',
}

export default function TripParticipants({
  tripId,
}: {
  tripId: string | undefined
}) {
  const { data: participants } = useGetTripParticipants(tripId)

  if (!participants || participants.length === 0) return null

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
      {participants.map((p) => (
        <Tooltip
          key={p.userId}
          title={`${p.username}${p.isOwner ? ' (organisateur)' : ''} — ${STATUS_LABEL[p.status]}`}
        >
          <Avatar
            src={p.profilePicture ?? undefined}
            style={{ border: `3px solid ${STATUS_COLOR[p.status]}` }}
          >
            {p.username?.[0]?.toUpperCase()}
          </Avatar>
        </Tooltip>
      ))}
    </div>
  )
}
