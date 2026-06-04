export type UpdateStatus =
  | { type: 'checking' }
  | { type: 'available'; version: string }
  | { type: 'not-available'; version: string }
  | { type: 'downloading'; percent: number }
  | { type: 'downloaded'; version: string }
  | { type: 'error'; message: string }
  | { type: 'dev-mode' }

interface ElectronAPI {
  checkForUpdates: () => void
  installUpdate: () => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
