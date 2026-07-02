import { useAuth } from '#web/hooks/useAuth'
import {
  useGetTripParticipants,
  useSetParticipation,
} from '#web/hooks/useShares'
import type { ParticipationStatus } from '@roadtrip/shared'
import { Avatar, Dropdown, Tooltip } from 'antd'

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
  const { userId } = useAuth()
  const { data: participants } = useGetTripParticipants(tripId)
  const { mutate: setParticipation } = useSetParticipation(tripId ?? '')

  if (!participants || participants.length === 0) return null

  const menuItems = [
    {
      key: 'accepted',
      label: 'Je participe',
      onClick: () => setParticipation('accepted'),
    },
    {
      key: 'declined',
      label: 'Je ne participe pas',
      onClick: () => setParticipation('declined'),
    },
  ]

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
      {participants.map((p) => {
        const isMe = p.userId === userId && !p.isOwner
        const avatar = (
          <span
            style={{
              display: 'inline-flex',
              cursor: isMe ? 'pointer' : 'default',
            }}
          >
            <Avatar
              src={p.profilePicture ?? undefined}
              style={{ border: `3px solid ${STATUS_COLOR[p.status]}` }}
            >
              {p.username?.[0]?.toUpperCase()}
            </Avatar>
          </span>
        )

        return (
          <Tooltip
            key={p.userId}
            title={`${p.username}${p.isOwner ? ' (organisateur)' : ''} — ${STATUS_LABEL[p.status]}`}
          >
            {isMe ? (
              <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                {avatar}
              </Dropdown>
            ) : (
              avatar
            )}
          </Tooltip>
        )
      })}
    </div>
  )
}
