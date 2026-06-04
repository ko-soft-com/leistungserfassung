import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import updater from 'electron-updater'
const { autoUpdater } = updater

interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
}

function getWindowStateFile(): string {
  return join(app.getPath('userData'), 'window-state.json')
}

function loadWindowState(): WindowState {
  try {
    const file = getWindowStateFile()
    if (existsSync(file)) {
      return JSON.parse(readFileSync(file, 'utf-8')) as WindowState
    }
  } catch {
    // ignore corrupt state
  }
  return { width: 1280, height: 800 }
}

function saveWindowState(win: BrowserWindow): void {
  if (win.isMaximized() || win.isMinimized()) return
  const bounds = win.getBounds()
  try {
    writeFileSync(
      getWindowStateFile(),
      JSON.stringify({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }),
    )
  } catch {
    // ignore write errors
  }
}

let isQuitting = false

function createWindow(): BrowserWindow {
  const state = loadWindowState()

  const win = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
    },
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  win.on('resize', () => saveWindowState(win))
  win.on('move', () => saveWindowState(win))

  win.on('close', (e) => {
    if (isQuitting) {
      saveWindowState(win)
      return
    }
    e.preventDefault()
    saveWindowState(win)
    win.hide()
  })

  return win
}

function getTrayIconPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'tray-icon.png')
    : join(__dirname, '../../resources/tray-icon.png')
}

function buildTrayMenu(win: BrowserWindow, updateReady = false): Menu {
  const items: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Leistungserfassung anzeigen',
      click: () => {
        win.show()
        win.focus()
      },
    },
    { type: 'separator' },
  ]

  if (updateReady) {
    items.push({
      label: 'Update installieren und neu starten',
      click: () => autoUpdater.quitAndInstall(),
    })
    items.push({ type: 'separator' })
  }

  items.push({ label: 'Beenden', click: () => app.quit() })

  return Menu.buildFromTemplate(items)
}

function createTray(win: BrowserWindow): Tray {
  const icon = nativeImage.createFromPath(getTrayIconPath())
  const tray = new Tray(
    process.platform === 'darwin' ? icon.resize({ width: 16, height: 16 }) : icon,
  )

  tray.setToolTip('Leistungserfassung')
  tray.setContextMenu(buildTrayMenu(win))

  tray.on('click', () => {
    if (win.isVisible()) {
      win.hide()
    } else {
      win.show()
      win.focus()
    }
  })

  return tray
}

function sendUpdateStatus(win: BrowserWindow, status: object): void {
  if (!win.isDestroyed()) win.webContents.send('update-status', status)
}

function setupAutoUpdater(tray: Tray, win: BrowserWindow): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () =>
    sendUpdateStatus(win, { type: 'checking' }),
  )
  autoUpdater.on('update-available', (info) =>
    sendUpdateStatus(win, { type: 'available', version: info.version }),
  )
  autoUpdater.on('update-not-available', (info) =>
    sendUpdateStatus(win, { type: 'not-available', version: info.version }),
  )
  autoUpdater.on('download-progress', (p) =>
    sendUpdateStatus(win, { type: 'downloading', percent: Math.round(p.percent) }),
  )
  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateStatus(win, { type: 'downloaded', version: info.version })
    tray.setContextMenu(buildTrayMenu(win, true))
    tray.setToolTip('Leistungserfassung – Update bereit')
  })
  autoUpdater.on('error', (err) =>
    sendUpdateStatus(win, { type: 'error', message: err.message }),
  )

  ipcMain.on('check-for-updates', () => {
    if (!app.isPackaged) {
      sendUpdateStatus(win, { type: 'dev-mode' })
      return
    }
    autoUpdater.checkForUpdates().catch(() => {})
  })

  ipcMain.on('install-update', () => autoUpdater.quitAndInstall())

  if (app.isPackaged) {
    autoUpdater.checkForUpdates().catch(() => {})
  }
}

function createAppMenu(win: BrowserWindow): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Hilfe',
      submenu: [
        {
          label: 'Nach Updates suchen…',
          click: () => {
            win.show()
            win.focus()
            win.webContents.send('trigger-update-check')
          },
        },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  const win = createWindow()
  const tray = createTray(win)
  createAppMenu(win)
  setupAutoUpdater(tray, win)

  app.on('activate', () => {
    win.show()
    win.focus()
  })
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  // intentionally empty — app stays alive in tray
})
