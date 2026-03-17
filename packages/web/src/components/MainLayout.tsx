import Footer from '#web/components/Footer'
import Header from '#web/components/Header'
import { useNetworkSync } from '#web/hooks/useNetworkSync'
import { Outlet } from 'react-router-dom'
import ConnectionIndicator from './ConnectionIndicator'
import styles from './MainLayout.module.css'

export default function MainLayout() {
  const { isSyncing } = useNetworkSync()
  return (
    <>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer>
        <ConnectionIndicator isSyncing={isSyncing} />
      </Footer>
    </>
  )
}
