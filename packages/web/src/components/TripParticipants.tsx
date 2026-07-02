import { useAuth } from '#web/hooks/useAuth'
import {
  useGetTripParticipants,
  useSetParticipation,
} from '#web/hooks/useShares'
import type { ParticipationStatus } from '@roadtrip/shared'
import { Avatar, Button, Dropdown, Modal, Tooltip } from 'antd'
import { useState } from 'react'

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
  const [dismissed, setDismissed] = useState(false)

  if (!participants || participants.length === 0) return null

  const me = participants.find((p) => p.userId === userId && !p.isOwner)
  const promptOpen = me?.status === 'pending' && !dismissed

  const respond = (status: 'accepted' | 'declined') => {
    setParticipation(status)
    setDismissed(true)
  }

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
    <>
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

      <Modal
        title="Participation au voyage"
        open={promptOpen}
        onCancel={() => setDismissed(true)}
        footer={null}
      >
        <p>Participez-vous à ce voyage ?</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Button type="primary" onClick={() => respond('accepted')}>
            Oui, je participe
          </Button>
          <Button danger onClick={() => respond('declined')}>
            Non
          </Button>
        </div>
      </Modal>
    </>
  )
}
