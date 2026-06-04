import { contextBridge, ipcRenderer } from 'electron'

ipcRenderer.on('update-status', (_e, status) => {
  window.dispatchEvent(new CustomEvent('electron:update-status', { detail: status }))
})

ipcRenderer.on('trigger-update-check', () => {
  window.dispatchEvent(new CustomEvent('electron:trigger-update-check'))
})

contextBridge.exposeInMainWorld('electronAPI', {
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  installUpdate: () => ipcRenderer.send('install-update'),
})
