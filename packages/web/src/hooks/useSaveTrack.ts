import { useCreateTrack } from '#web/hooks/mutations/useCreateTrack'
import { useAuth } from '#web/hooks/useAuth'
import { message } from 'antd'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const PENDING_SAVE_GPX_KEY = 'roadtrip:pending-save-gpx'

export function useSaveTrack() {
  const { accessToken } = useAuth()
  const { mutateAsync: createTrack } = useCreateTrack()
  const navigate = useNavigate()

  return async (gpxContent: string) => {
    if (!accessToken) {
      localStorage.setItem(PENDING_SAVE_GPX_KEY, gpxContent)
      navigate('/login')
      return
    }
    try {
      const { id } = await createTrack({ gpxContent })
      navigate(`/tracks/${id}`, { state: { justSaved: true } })
    } catch (error) {
      message.error(
        `Erreur lors de la sauvegarde : ${
          error instanceof Error ? error.message : 'inconnue'
        }`
      )
    }
  }
}

export function useResumePendingSave() {
  const { accessToken } = useAuth()
  const save = useSaveTrack()

  useEffect(() => {
    if (!accessToken) return
    const pending = localStorage.getItem(PENDING_SAVE_GPX_KEY)
    if (!pending) return
    localStorage.removeItem(PENDING_SAVE_GPX_KEY)
    void save(pending)
  }, [accessToken, save])
}
