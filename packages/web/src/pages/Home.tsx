import { useState, lazy, Suspense } from 'react'
import styles from './Home.module.css'
import { GpxUploader } from '#web/components/GpxUploader'
import { Header } from '#web/components/Header'
import { HumidityChart } from '#web/components/HumidityChart'
import { TimeSelector } from '#web/components/TimeSelector'
import { Title } from '#web/components/Title'
import { useParseGpx } from '#web/hooks/useApi'
const MapView = lazy(() => import('#web/components/MapView'))

function Home() {
  const [timepointIndex, setTimepointIndex] = useState(0)

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
    <div className={styles.main}>
      <Header />
      <Title />
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
    </div>
  )
}

export default Home
