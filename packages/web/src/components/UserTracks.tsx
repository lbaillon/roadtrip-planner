import { useApi } from '#web/hooks/useApi'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import styles from './UserTracks.module.css'
import { faMotorcycle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function UserTracks() {
  const queryClient = useQueryClient()
  const fetch = useApi()
  const { data: tracks } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => fetch<{ id: string; name: string }[]>('/api/tracks'),
  })

  const { mutate: deleteTrack } = useMutation({
    mutationFn: (id: string) =>
      fetch<void>(`/api/tracks/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] })
    },
  })

  return (
    <div className={styles.tracksBox}>
      <h3>My tracks</h3>
      {(tracks ?? []).map((track) => (
        <p className={styles.track} key={track.id}>
          <FontAwesomeIcon icon={faMotorcycle} className={styles.motoIcon} />
          {track.name}
          <FontAwesomeIcon
            icon={faXmark}
            className={styles.deleteIcon}
            onClick={() => deleteTrack(track.id)}
          />
        </p>
      ))}
    </div>
  )
}
