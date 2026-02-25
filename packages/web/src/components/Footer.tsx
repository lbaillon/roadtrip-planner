import { type PropsWithChildren } from 'react'
import styles from './Footer.module.css'

export default function Footer({ children }: PropsWithChildren) {
  return <footer className={styles.footer}>{children}</footer>
}
