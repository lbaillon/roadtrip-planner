import { GpxUploader } from '#web/components/GpxUploader'
import { HumidityChart } from '#web/components/HumidityChart'
import { TimeSelector } from '#web/components/TimeSelector'
import { Title } from '#web/components/Title'
import { useGetWeather } from '#web/hooks/useApi'
import { useHealth } from '#web/hooks/useHealth'
import type { ParsedGpx } from '@roadtrip/shared'
import { message } from 'antd'
import { lazy, Suspense, useState } from 'react'
import { parseGpxFile, sampleRoutePoints } from '../lib/gpx-utils'
import styles from './Home.module.css'
const MapView = lazy(() => import('#web/components/MapView'))

export default function Home() {
  const [timepointIndex, setTimepointIndex] = useState(0)
  const [parsedGpx, setParsedGpx] = useState<ParsedGpx | null>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const { isReady } = useHealth()

  const {
    mutate: fetchWeather,
    data: weather,
    isPending: loading,
    isError,
    error,
  } = useGetWeather()

  const handleFileSelect = (content: string) => {
    try {
      const parsed = parseGpxFile(content)
      setParsedGpx(parsed)
      fetchWeather(
        { coordinates: sampleRoutePoints(parsed.coordinates) },
        { onError: (err) => messageApi.error(`Error: ${err.message}`) }
      )
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
        {loading && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p>Loading weather data...</p>
          </div>
        )}
        {isError && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p>Error occurred: {error.message}</p>
          </div>
        )}

        {parsedGpx && (
          <div className={styles.mapBox}>
            <h2 className={styles.routeName}>{parsedGpx.name}</h2>
            {parsedGpx.distance && (
              <p className={styles.routeName}>
                Distance: {(parsedGpx.distance / 1000).toFixed(2)} km
              </p>
            )}

            <Suspense fallback={<div>Loading map...</div>}>
              <MapView
                coordinates={parsedGpx.coordinates}
                weather={weather ?? []}
                timepointIndex={timepointIndex}
                waypoints={parsedGpx.waypoints}
              />
            </Suspense>

            {weather && (
              <>
                <TimeSelector
                  weather={weather}
                  setTimepointIndex={setTimepointIndex}
                  timepointIndex={timepointIndex}
                />

                <h3 className={styles.humidityPlot}>Humidity Chart</h3>

                <HumidityChart
                  coordinates={parsedGpx.coordinates}
                  weather={weather}
                  timepointIndex={timepointIndex}
                />
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
