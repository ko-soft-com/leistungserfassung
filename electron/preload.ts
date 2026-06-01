import { contextBridge } from 'electron'

// No custom APIs exposed — Web Notifications API is available directly in the renderer.
// Extend contextBridge here when native IPC is needed in future.
contextBridge.exposeInMainWorld('electronAPI', {})
