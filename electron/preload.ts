import { contextBridge, ipcRenderer } from 'electron'
import type { UpdateStatus } from '../src/types/electron'

contextBridge.exposeInMainWorld('electronAPI', {
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  installUpdate: () => ipcRenderer.send('install-update'),
  onUpdateStatus: (cb: (status: UpdateStatus) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, status: UpdateStatus) => cb(status)
    ipcRenderer.on('update-status', handler)
    return () => ipcRenderer.removeListener('update-status', handler)
  },
  onTriggerUpdateCheck: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('trigger-update-check', handler)
    return () => ipcRenderer.removeListener('trigger-update-check', handler)
  },
})
