import { GpxUploader } from '#web/components/GpxUploader'
import { Title } from '#web/components/Title'
import TrackContent from '#web/components/TrackContent'
import { useHealth } from '#web/hooks/useHealth'
import { parseGpxFile } from '#web/lib/gpx-utils'
import type { ParsedGpx } from '@roadtrip/shared'
import { message } from 'antd'
import { useState } from 'react'
import styles from './Home.module.css'

export default function Home() {
  const [parsedGpx, setParsedGpx] = useState<ParsedGpx | null>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const { isReady } = useHealth()

  const handleFileSelect = (content: string) => {
    try {
      const parsed = parseGpxFile(content)
      setParsedGpx(parsed)
    } catch (e) {
      messageApi.error(
        e instanceof Error ? e.message : 'Failed to parse GPX file'
      )
    }
  }

  return (
    <>
      {contextHolder}
      <Title />
      <div className={styles.contentBox}>
        <div className={styles.uploadBox}>
          {isReady ? (
            <GpxUploader onFileSelect={handleFileSelect} />
          ) : (
            <p>GPX preview is unavailable offline.</p>
          )}
        </div>

        {parsedGpx && <TrackContent parsed={parsedGpx} />}
      </div>
    </>
  )
}
