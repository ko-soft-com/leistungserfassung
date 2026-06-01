import changelogRaw from '../../../CHANGELOG.md?raw'
import ChangelogDialog from './ChangelogDialog'
import { useFirestoreStatus } from '../../hooks/useFirestoreStatus'
import type { FirestoreStatus } from '../../hooks/useFirestoreStatus'
import styles from './AppFooter.module.css'

function calver(): string {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const STATUS_LABEL: Record<FirestoreStatus, string> = {
  connected: 'Verbunden',
  checking: 'Verbinde…',
  offline: 'Offline',
}

const STATUS_COLOR: Record<FirestoreStatus, string> = {
  connected: 'var(--clr-status-ok, #22c55e)',
  checking: 'var(--clr-status-warn, #f59e0b)',
  offline: 'var(--clr-status-err, #ef4444)',
}

export default function AppFooter() {
  const status = useFirestoreStatus()

  return (
    <footer className={styles.footer} role="contentinfo">
      <span className={styles.copy}>Leistungserfassung · v{calver()}</span>
      <div className={styles.right}>
        <span className={styles.status} title="Firestore-Verbindungsstatus">
          <span
            className={styles.dot}
            style={{ background: STATUS_COLOR[status] }}
            aria-hidden="true"
          />
          {STATUS_LABEL[status]}
        </span>
        <ChangelogDialog changelogRaw={changelogRaw} />
      </div>
    </footer>
  )
}
