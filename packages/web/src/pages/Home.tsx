import { GpxUploader } from '#web/components/GpxUploader'
import { HumidityChart } from '#web/components/HumidityChart'
import { TimeSelector } from '#web/components/TimeSelector'
import { Title } from '#web/components/Title'
import { useApi, useParseGpx } from '#web/hooks/useApi'
import { useQuery } from '@tanstack/react-query'
import { lazy, Suspense, useState } from 'react'
import styles from './Home.module.css'
const MapView = lazy(() => import('#web/components/MapView'))

export default function Home() {
  const [timepointIndex, setTimepointIndex] = useState(0)

  const fetch = useApi()
  const { data: testAuth } = useQuery({
    queryKey: ['testauth'],
    queryFn: () => fetch<{ message: string }>('/api/testauth'),
    refetchInterval: 5000,
  })

  const {
    mutate: uploadGpx,
    data: routeData,
    isPending: loading,
    isError,
    error,
  } = useParseGpx()

  const handleFileSelect = (content: string) => {
    uploadGpx(
      { gpxContent: content },
      { onError: (error) => alert(`Error: ${error.message}`) }
    )
  }
  return (
    <>
      <Title />
      <p>{testAuth?.message ?? 'Not authenticated'}</p>
      <div className={styles.uploadBox}>
        <GpxUploader onFileSelect={handleFileSelect} />
      </div>
      {loading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Loading route and weather data...</p>
        </div>
      )}
      {isError && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Error occurred: {error.message}</p>
        </div>
      )}

      {routeData && (
        <div className={styles.mapBox}>
          <h2 className={styles.routeName}>{routeData.route.name}</h2>
          {routeData.route.distance && (
            <p>Distance: {(routeData.route.distance / 1000).toFixed(2)} km</p>
          )}

          <Suspense fallback={<div>Loading map...</div>}>
            <MapView
              coordinates={routeData.route.coordinates}
              weather={routeData.weather}
              timepointIndex={timepointIndex}
            />
          </Suspense>

          <TimeSelector
            weather={routeData.weather}
            setTimepointIndex={setTimepointIndex}
            timepointIndex={timepointIndex}
          />

          <h3 className={styles.humidityPlot}>Humidity Chart</h3>

          <HumidityChart
            coordinates={routeData.route.coordinates}
            weather={routeData.weather}
            timepointIndex={timepointIndex}
          />
        </div>
      )}
    </>
  )
}
