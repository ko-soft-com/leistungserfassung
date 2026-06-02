import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
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

function setupAutoUpdater(tray: Tray, win: BrowserWindow): void {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-downloaded', () => {
    tray.setContextMenu(buildTrayMenu(win, true))
    tray.setToolTip('Leistungserfassung – Update bereit')
  })

  autoUpdater.checkForUpdates().catch(() => {
    // ignore network errors silently
  })
}

app.whenReady().then(() => {
  const win = createWindow()
  const tray = createTray(win)
  setupAutoUpdater(tray, win)

  app.on('activate', () => {
    win.show()
    win.focus()
  })
})

app.on('window-all-closed', () => {
  // intentionally empty — app stays alive in tray
})
