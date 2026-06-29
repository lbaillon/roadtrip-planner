import { useCreateTrack } from '#web/hooks/mutations/useCreateTrack'
import { useAuth } from '#web/hooks/useAuth'
import { message } from 'antd'
import { useNavigate } from 'react-router-dom'

export const PENDING_SAVE_GPX_KEY = 'roadtrip:pending-save-gpx'

export function useSaveTrack() {
  const { accessToken } = useAuth()
  const { mutate: createTrack } = useCreateTrack()
  const navigate = useNavigate()

  return (gpxContent: string) => {
    if (!accessToken) {
      sessionStorage.setItem(PENDING_SAVE_GPX_KEY, gpxContent)
      navigate('/login')
      return
    }
    createTrack(
      { gpxContent },
      {
        onSuccess: ({ id }) =>
          navigate(`/tracks/${id}`, { state: { justSaved: true } }),
        onError: (error) =>
          message.error(`Erreur lors de la sauvegarde : ${error.message}`),
      }
    )
  }
}
