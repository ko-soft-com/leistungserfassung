import { useEffect, useRef } from 'react'
import { useTimerStore } from '../stores/timer'

const THRESHOLD_MS = 2 * 60 * 60 * 1000

export function useStopwatchNotification(): void {
  const activeTimer = useTimerStore((s) => s.activeTimer)
  const notifiedForRef = useRef<number | null>(null)

  useEffect(() => {
    if (!activeTimer) {
      notifiedForRef.current = null
      return
    }

    const { startedAt } = activeTimer

    function check(): void {
      if (notifiedForRef.current === startedAt) return
      if (Date.now() - startedAt >= THRESHOLD_MS) {
        notifiedForRef.current = startedAt
        new Notification('Leistungserfassung', { body: 'Stoppuhr läuft seit 2 Stunden' })
      }
    }

    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [activeTimer])
}
