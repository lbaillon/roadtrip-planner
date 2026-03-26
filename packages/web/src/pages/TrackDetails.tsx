import TrackContent from '#web/components/TrackContent'
import { useGetTrack } from '#web/hooks/useTracks'
import { parseGpxFile } from '#web/lib/gpx-utils'
import { Button } from 'antd'
import { useParams } from 'react-router-dom'
import styles from './TrackDetails.module.css'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function TrackDetails() {
  const { id } = useParams()

  const { data: track, isLoading } = useGetTrack(id)
  const parsed = track ? parseGpxFile?.(track.gpxContent) : undefined

  function handleDownload() {
    if (!track) return
    const blob = new Blob([track.gpxContent], { type: 'application/gpx+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${track.name}.gpx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.contentBox}>
      {isLoading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Loading route...</p>
        </div>
      )}

      {parsed && (
        <TrackContent
          parsed={parsed}
          headerAction={
            <Button onClick={handleDownload} className={styles.downloadButton}>
              <FontAwesomeIcon
                className={styles.downloadIcon}
                icon={faDownload}
              />
            </Button>
          }
        />
      )}
    </div>
  )
}
