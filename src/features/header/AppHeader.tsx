import { Clock } from 'lucide-react'
import styles from './AppHeader.module.css'

const navItems = [
  { label: 'Übersicht', href: '/dashboard' },
  { label: 'Erfassung', href: '/erfassung' },
  { label: 'Berichte', href: '/berichte' },
  { label: 'Stammdaten', href: '/stammdaten' },
]

export default function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo}><Clock size={16} color="#fff" /></div>
        <span className={styles.wordmark}>Leistungserfassung</span>
      </div>
      <nav className={styles.nav}>
        {navItems.map(item => (
          <a
            key={item.href}
            href={item.href}
            className={[styles.navItem, item.href === '/erfassung' ? styles.active : ''].filter(Boolean).join(' ')}
          >
            {item.label}
          </a>
        ))}
      </nav>
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
