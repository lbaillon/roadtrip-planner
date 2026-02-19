import styles from './TimeSelector.module.css'
import type { WeatherData } from '@roadtrip/shared'

interface TimeSelectorProps {
  weather : WeatherData[]
  setTimepointIndex: (i:number) => void
}

export function TimeSelector({weather = [], setTimepointIndex} : TimeSelectorProps) {
  if (weather.length === 0) return null
  const allTimepoints = weather[0]?.timepoints ?? []

  const buttons = allTimepoints.map((timepoint, idx) => {
    const date = new Date(timepoint.time *1000)
    return <button className={styles.button} key={`timepoint-${idx}`} onClick={()=>setTimepointIndex(idx)}>{date.toLocaleTimeString('fr-FR', { hour: '2-digit' })}</button>
  })
  

  return (
    <div className={styles.buttonContainer}>{buttons}</div>
  )
}