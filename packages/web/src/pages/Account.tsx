import Box from '#web/components/Box'
import BoxTitle from '#web/components/BoxTitle'
import UserGreeting from '#web/components/UserGreeting'
import { useGetMe } from '#web/hooks/useAccount'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Avatar } from 'antd'

export default function Account() {
  const { data: me, isLoading } = useGetMe()

  return (
    <>
      <UserGreeting />
      <Box>
        <BoxTitle>Mon compte</BoxTitle>
        {isLoading ? (
          <p>Chargement...</p>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <Avatar
              size={96}
              src={me?.profilePicture ?? undefined}
              icon={<FontAwesomeIcon icon={faUser} />}
            />
            <p>
              <strong>Nom d'utilisateur :</strong> {me?.username}
            </p>
            <p>
              <strong>Email :</strong> {me?.email}
            </p>
          </div>
        )}
      </Box>
    </>
  )
}
