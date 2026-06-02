import * as Dialog from '@radix-ui/react-dialog'
import type { UpdateStatus } from '../types/electron'
import styles from './UpdateModal.module.css'

interface Props {
  open: boolean
  status: UpdateStatus | null
  onClose: () => void
  onInstall: () => void
}

function StatusContent({ status, onInstall }: { status: UpdateStatus | null; onInstall: () => void }) {
  if (!status) return <p className={styles.message}>Suche nach Updates…</p>

  switch (status.type) {
    case 'checking':
      return <p className={styles.message}>Suche nach Updates…</p>
    case 'available':
      return <p className={styles.message}>Update <strong>v{status.version}</strong> gefunden — wird heruntergeladen…</p>
    case 'not-available':
      return <p className={styles.message}>App ist aktuell <span className={styles.version}>(v{status.version})</span></p>
    case 'downloading':
      return (
        <>
          <p className={styles.message}>Lade Update herunter…</p>
          <div className={styles.progressTrack}>
            <div className={styles.progressBar} style={{ width: `${status.percent}%` }} />
          </div>
          <p className={styles.percent}>{status.percent} %</p>
        </>
      )
    case 'downloaded':
      return (
        <>
          <p className={styles.message}>Update <strong>v{status.version}</strong> bereit zur Installation.</p>
          <button className={styles.installBtn} onClick={onInstall}>
            Jetzt installieren und neu starten
          </button>
        </>
      )
    case 'error':
      return <p className={styles.error}>Fehler: {status.message}</p>
    case 'dev-mode':
      return <p className={styles.message}>Update-Check ist im Entwicklungsmodus nicht verfügbar.</p>
  }
}

export default function UpdateModal({ open, status, onClose, onInstall }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content}>
          <Dialog.Title className={styles.title}>Software-Update</Dialog.Title>
          <div className={styles.body}>
            <StatusContent status={status} onInstall={onInstall} />
          </div>
          <Dialog.Close asChild>
            <button className={styles.closeBtn}>Schließen</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
