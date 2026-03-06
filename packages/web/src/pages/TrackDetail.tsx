import MapView from '#web/components/MapView'
import { useGetTrack, useParseGpx } from '#web/hooks/useApi'
import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styles from './Home.module.css'
import { TimeSelector } from '#web/components/TimeSelector'
import { HumidityChart } from '#web/components/HumidityChart'


export default function TrackDetail() {
  const [timepointIndex, setTimepointIndex] = useState(0)
  const { id } = useParams()
  const {data: track} = useGetTrack(id)

    const {
      mutate: uploadGpx,
      data: routeData,
      isPending: loading,
      isError,
      error,
    } = useParseGpx()

    useEffect(()=>{
      if(!track){
        return
      }
      uploadGpx(
      { gpxContent: track.gpxContent },
      { onError: (error) => alert(`Error: ${error.message}`) }
    )
    },[track, uploadGpx])

  return (
    <>
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
              <p className={styles.routeName}>
                Distance: {(routeData.route.distance / 1000).toFixed(2)} km
              </p>
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
