import { useState } from 'react'
import styles from './App.module.css'
import { GpxUploader } from './components/GpxUploader'
import { Header } from './components/Header'
import { HumidityChart } from './components/HumidityChart'
import { MapView } from './components/MapView'
import { TimeSelector } from './components/TimeSelector'
import { Title } from './components/Title'
import { useParseGpx } from './hooks/useApi'

function App() {
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

          <MapView
            coordinates={routeData.route.coordinates}
            weather={routeData.weather}
            timepointIndex={timepointIndex}
          />

          <TimeSelector
            weather={routeData.weather}
            setTimepointIndex={setTimepointIndex}
          />

          <h3 className={styles.humidityPlot}>Humidity Chart</h3>

          <HumidityChart
            coordinates={routeData.route.coordinates}
            weather={routeData.weather}
          />
        </div>
      )}
    </div>
  )
}

export default App
