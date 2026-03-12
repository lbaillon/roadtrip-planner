import { type PropsWithChildren } from 'react'
import styles from './Box.module.css'

export default function Box({ children }: PropsWithChildren) {
  return <div className={styles.box}>{children}</div>
}
