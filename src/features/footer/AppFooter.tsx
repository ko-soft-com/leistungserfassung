import { useState, useEffect } from 'react'
import changelogRaw from '../../../CHANGELOG.md?raw'
import ChangelogDialog from './ChangelogDialog'
import { useFirestoreStatus } from '../../hooks/useFirestoreStatus'
import type { FirestoreStatus } from '../../hooks/useFirestoreStatus'
import type { UpdateStatus } from '../../types/electron'
import styles from './AppFooter.module.css'

declare const __APP_VERSION__: string

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

function useUpdateFooterStatus() {
  const [status, setStatus] = useState<UpdateStatus | null>(null)
  useEffect(() => {
    function onStatus(e: Event) {
      setStatus((e as CustomEvent<UpdateStatus>).detail)
    }
    window.addEventListener('electron:update-status', onStatus)
    return () => window.removeEventListener('electron:update-status', onStatus)
  }, [])
  return status
}

function UpdateBadge({ status }: { status: UpdateStatus | null }) {
  if (!status) return null
  switch (status.type) {
    case 'checking':
      return <span className={styles.updateBadge}>Suche nach Updates…</span>
    case 'available':
      return <span className={styles.updateBadge}>Update v{status.version} gefunden</span>
    case 'not-available':
      return <span className={`${styles.updateBadge} ${styles.updateOk}`}>Aktuell</span>
    case 'downloading':
      return <span className={styles.updateBadge}>Update lädt… {status.percent}%</span>
    case 'downloaded':
      return (
        <button
          className={`${styles.updateBadge} ${styles.updateReady}`}
          onClick={() => window.electronAPI?.installUpdate()}
        >
          Update bereit — jetzt installieren
        </button>
      )
    case 'error':
      return <span className={`${styles.updateBadge} ${styles.updateError}`}>Update-Fehler</span>
    case 'dev-mode':
      return <span className={styles.updateBadge}>Dev-Mode</span>
    default:
      return null
  }
}

export default function AppFooter() {
  const firestoreStatus = useFirestoreStatus()
  const updateStatus = useUpdateFooterStatus()

  return (
    <footer className={styles.footer} role="contentinfo">
      <span className={styles.copy}>Leistungserfassung · v{__APP_VERSION__}</span>
      <div className={styles.right}>
        <UpdateBadge status={updateStatus} />
        <span className={styles.status} title="Firestore-Verbindungsstatus">
          <span
            className={styles.dot}
            style={{ background: STATUS_COLOR[firestoreStatus] }}
            aria-hidden="true"
          />
          {STATUS_LABEL[firestoreStatus]}
        </span>
        <ChangelogDialog changelogRaw={changelogRaw} />
      </div>
    </footer>
  )
}
