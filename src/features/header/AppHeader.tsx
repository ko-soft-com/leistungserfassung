import { Clock } from 'lucide-react'
import styles from './AppHeader.module.css'

export default function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo}><Clock size={16} color="#fff" /></div>
        <span className={styles.wordmark}>Leistungserfassung</span>
      </div>
      <div className={styles.right}>
        <div className={styles.searchPill}>
          <span>Suchen</span>
          <kbd className={styles.kbd}>⌘K</kbd>
        </div>
        <div className={styles.avatar} aria-label="Benutzer-Menü">MK</div>
      </div>
    </header>
  )
}
