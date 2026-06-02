import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  installUpdate: () => ipcRenderer.send('install-update'),
  onUpdateStatus: (cb: (status: unknown) => void) => {
    ipcRenderer.removeAllListeners('update-status')
    ipcRenderer.on('update-status', (_e, status) => cb(status))
  },
  onTriggerUpdateCheck: (cb: () => void) => {
    ipcRenderer.removeAllListeners('trigger-update-check')
    ipcRenderer.on('trigger-update-check', () => cb())
  },
})
