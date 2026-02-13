import styles from './App.module.css'
import { GpxUploader } from './components/GpxUploader'
import { Header } from './components/Header'
import { MapView } from './components/MapView'
import { Title } from './components/Title'
import { useParseGpx } from './hooks/useApi'

function App() {
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
      { onError: (error) => alert(`Error: ${error.message}`) },
    )
  }
  return (
    // <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
    //     <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
    //         🚗 Roadtrip Weather Planner
    //     </h1>

    //     <GpxUploader onFileSelect={handleFileSelect} />

    //     {loading && (
    //         <div style={{ textAlign: "center", marginTop: "20px" }}>
    //             <p>Loading route and weather data...</p>
    //         </div>
    //     )}

    //     {routeData && (
    //         <div style={{ marginTop: "30px" }}>
    //             <h2>{routeData.route.name}</h2>
    //             {routeData.route.distance && (
    //                 <p>
    //                     Distance:{" "}
    //                     {(routeData.route.distance / 1000).toFixed(2)} km
    //                 </p>
    //             )}

    //             <MapView
    //                 coordinates={routeData.route.coordinates}
    //                 weather={routeData.weather}
    //             />

    //             <div style={{ marginTop: "20px" }}>
    //                 <h3>Weather Along Route</h3>
    //                 <div
    //                     style={{
    //                         display: "grid",
    //                         gridTemplateColumns:
    //                             "repeat(auto-fill, minmax(200px, 1fr))",
    //                         gap: "15px",
    //                     }}
    //                 >
    //                     {routeData.weather.map((w, idx) => (
    //                         <div
    //                             key={idx}
    //                             style={{
    //                                 border: "1px solid #ddd",
    //                                 borderRadius: "8px",
    //                                 padding: "15px",
    //                                 backgroundColor: "#f9f9f9",
    //                             }}
    //                         >
    //                             <p>
    //                                 <strong>{w.description}</strong>
    //                             </p>
    //                             <p>🌡️ {w.temperature.toFixed(1)}°C</p>
    //                             <p>💨 {w.windSpeed?.toFixed(1)} m/s</p>
    //                             <p>💧 {w.humidity}%</p>
    //                         </div>
    //                     ))}
    //                 </div>
    //             </div>
    //         </div>
    //     )}
    // </div>

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
        <div style={{ marginTop: '30px' }}>
          <h2>{routeData.route.name}</h2>
          {routeData.route.distance && (
            <p>Distance: {(routeData.route.distance / 1000).toFixed(2)} km</p>
          )}

          <MapView
            coordinates={routeData.route.coordinates}
            weather={routeData.weather}
          />

          <div style={{ marginTop: '20px' }}>
            <h3>Weather Along Route</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '15px',
              }}
            >
              {routeData.weather.map((w, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: '#f9f9f9',
                  }}
                >
                  <p>
                    <strong>{w.description}</strong>
                  </p>
                  <p>🌡️ {w.temperature.toFixed(1)}°C</p>
                  <p>💨 {w.windSpeed?.toFixed(1)} m/s</p>
                  <p>💧 {w.humidity}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
