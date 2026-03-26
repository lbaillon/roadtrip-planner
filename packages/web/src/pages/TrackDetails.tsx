import TrackContent from '#web/components/TrackContent'
import {
  useGetParsedTrack,
  useGetTrack
} from '#web/hooks/useTracks'
import { Button } from 'antd'
import { useParams } from 'react-router-dom'
import styles from './TrackDetails.module.css'



export default function TrackDetails() {



  
  const { id } = useParams()

  const { data: track } = useGetTrack(id)
  const { data: parsed, isLoading: parsedLoading } = useGetParsedTrack(id)




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
      {parsedLoading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Loading route...</p>
        </div>
      )}
          <div className={styles.trackActions}>
            <Button onClick={handleDownload}>Download GPX</Button>
          </div>

      {parsed && (
        <TrackContent parsed={parsed}/>
      )}
    </div>
  )
}
