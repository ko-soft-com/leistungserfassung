import { useState, useEffect } from 'react'

export function useElapsedTime(startedAt: number | null): string {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (startedAt === null) { setElapsed(0); return }
    const update = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
