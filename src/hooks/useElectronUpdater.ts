import { useState, useEffect } from 'react'
import type { UpdateStatus } from '../types/electron'

export function useElectronUpdater() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<UpdateStatus | null>(null)

  useEffect(() => {
    function onStatus(e: Event) {
      setStatus((e as CustomEvent<UpdateStatus>).detail)
    }
    function onTrigger() {
      setStatus(null)
      setOpen(true)
      window.electronAPI?.checkForUpdates()
    }
    window.addEventListener('electron:update-status', onStatus)
    window.addEventListener('electron:trigger-update-check', onTrigger)
    return () => {
      window.removeEventListener('electron:update-status', onStatus)
      window.removeEventListener('electron:trigger-update-check', onTrigger)
    }
  }, [])

  return {
    open,
    status,
    close: () => setOpen(false),
    install: () => window.electronAPI?.installUpdate(),
    openAndCheck: () => {
      setStatus(null)
      setOpen(true)
      window.electronAPI?.checkForUpdates()
    },
  }
}
