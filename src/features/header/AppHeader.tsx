import { Clock, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import styles from './AppHeader.module.css'

export default function AppHeader() {
  const { user, signOut } = useAuth()
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??'

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
        <span className={styles.userEmail}>{user?.email}</span>
        <button
          className={styles.logoutButton}
          onClick={signOut}
          title="Abmelden"
          aria-label="Abmelden"
        >
          <LogOut size={14} />
        </button>
        <div className={styles.avatar} aria-label="Benutzer">{initials}</div>
      </div>
    </header>
  )
}
