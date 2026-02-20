import styles from './HourButton.module.css'

interface HourButtonProps {
  label: string
  onClick: () => void
  isSelected: boolean
}

export function HourButton({ label, onClick, isSelected }: HourButtonProps) {
  return (
    <button
      className={`${styles.hourButton} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
