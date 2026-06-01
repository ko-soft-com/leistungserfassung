import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useToastStore } from '../stores/toast'
import type { Toast } from '../stores/toast'
import styles from './ToastContainer.module.css'

const AUTO_DISMISS_MS = 4000

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore(s => s.removeToast)

  useEffect(() => {
    const id = setTimeout(() => removeToast(toast.id), AUTO_DISMISS_MS)
    return () => clearTimeout(id)
  }, [toast.id, removeToast])

  return (
    <div className={`${styles.toast} ${styles[toast.variant]}`} role="status" aria-live="polite">
      <span className={styles.message}>{toast.message}</span>
      <button
        className={styles.close}
        onClick={() => removeToast(toast.id)}
        aria-label="Benachrichtigung schließen"
      >
        <X size={13} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useToastStore(s => s.toasts)
  if (toasts.length === 0) return null

  return (
    <div className={styles.container}>
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  )
}
