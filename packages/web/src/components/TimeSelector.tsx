import styles from './TimeSelector.module.css'
import type { WeatherData } from '@roadtrip/shared'
import { HourButton } from './HourButton'

interface TimeSelectorProps {
  weather: WeatherData[]
  setTimepointIndex: (i: number) => void
  timepointIndex: number
}

export function TimeSelector({
  weather = [],
  setTimepointIndex,
  timepointIndex
}: TimeSelectorProps) {
  if (weather.length === 0) return null
  const allTimepoints = weather[0]?.timepoints ?? []

  const buttons = allTimepoints.map((timepoint, idx) => {
    const date = new Date(timepoint.time * 1000)
    return (
      <HourButton
        key={`timepoint-${idx}`}
        label={date.toLocaleTimeString('fr-FR', { hour: '2-digit' })}
        onClick={() => setTimepointIndex(idx)}
        isSelected={idx === timepointIndex}
      />
    )
  })

  return <div className={styles.buttonContainer}>{buttons}</div>
}
