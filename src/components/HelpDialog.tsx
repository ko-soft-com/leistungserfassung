import { useEffect } from 'react'
import styles from './HelpDialog.module.css'

const SHORTCUTS = [
  { key: 'N', desc: 'Neuen Eintrag beginnen (Auftraggeber fokussieren)' },
  { key: '⌘ K', desc: 'Suche fokussieren' },
  { key: '?', desc: 'Diese Hilfe anzeigen' },
  { key: 'Esc', desc: 'Dialog schließen' },
]

interface HelpDialogProps {
  onClose: () => void
}

export default function HelpDialog({ onClose }: HelpDialogProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <dialog
        open
        className={styles.dialog}
        onClick={e => e.stopPropagation()}
        aria-label="Tastaturkürzel"
      >
        <h2 className={styles.title}>Tastaturkürzel</h2>
        <table className={styles.table}>
          <tbody>
            {SHORTCUTS.map(s => (
              <tr key={s.key}>
                <td><kbd className={styles.kbd}>{s.key}</kbd></td>
                <td className={styles.desc}>{s.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className={styles.closeBtn} onClick={onClose}>Schließen</button>
      </dialog>
    </div>
  )
}
