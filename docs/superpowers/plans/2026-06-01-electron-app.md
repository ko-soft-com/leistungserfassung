# Electron Desktop App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the existing React/Vite/Firebase web app as a native Electron desktop app for macOS and Windows, with System Tray, Desktop Notifications, and full Firebase Auth/Firestore support.

**Architecture:** electron-vite wraps the existing `src/` React app unchanged as the Electron renderer process. A new `electron/` directory contains the main process (`main.ts`) and a minimal preload script. electron-builder packages the result as `.dmg` (Mac) and NSIS installer (Windows).

**Tech Stack:** Electron 36, electron-vite 2, electron-builder 25, existing React 19 + Firebase 12 + Vite 8

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `package.json` | Modify | Add electron deps + new scripts + `main` field |
| `electron.vite.config.ts` | Create | electron-vite build config for main/preload/renderer |
| `tsconfig.node.json` | Modify | Add `electron` types + include `electron/**/*` |
| `electron/main.ts` | Create | BrowserWindow, Tray, window state, app lifecycle |
| `electron/preload.ts` | Create | Minimal contextBridge (no custom IPC) |
| `resources/tray-icon.png` | Create | Tray icon (16×16 PNG) |
| `build/icon.icns` | Create | macOS app icon (generated from PNG) |
| `build/icon.ico` | Create | Windows app icon (generated from PNG) |
| `electron-builder.yml` | Create | Packaging config (.dmg + NSIS) |
| `.gitignore` | Modify | Add `out/` and `release/` |
| `src/hooks/useStopwatchNotification.ts` | Create | Fires desktop notification after 2h timer |
| `src/hooks/__tests__/useStopwatchNotification.test.ts` | Create | Unit tests for the notification hook |
| `src/App.tsx` | Modify | Call `useStopwatchNotification()` |

---

## Task 1: Install Electron dependencies and update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install electron-vite, electron, electron-builder**

```bash
npm install --save-dev electron@36 electron-vite@2 electron-builder@25
```

Expected output ends with `added N packages` — no errors.

- [ ] **Step 2: Add `main` field and new scripts to package.json**

Open `package.json`. Add the `main` field at the top level (alongside `"name"`, `"version"`, etc.) and extend `"scripts"`:

```json
"main": "out/main/index.js",
```

In `"scripts"`, add these four entries (keep all existing scripts unchanged):

```json
"electron:dev":   "electron-vite dev",
"electron:build": "electron-vite build",
"dist:mac":       "electron-vite build && electron-builder --mac",
"dist:win":       "electron-vite build && electron-builder --win"
```

- [ ] **Step 3: Verify the change**

```bash
node -e "const p = JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log(p.main, Object.keys(p.scripts).filter(k => k.startsWith('electron') || k.startsWith('dist:')))"
```

Expected: `out/main/index.js [ 'electron:dev', 'electron:build', 'dist:mac', 'dist:win' ]`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(electron): install electron-vite, electron, electron-builder"
```

---

## Task 2: Create electron.vite.config.ts

**Files:**
- Create: `electron.vite.config.ts`

- [ ] **Step 1: Create the config**

Create `electron.vite.config.ts` at the project root:

```ts
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const now = new Date()
const calver = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    root: '.',
    build: {
      rollupOptions: {
        input: 'index.html',
      },
    },
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(calver),
    },
  },
})
```

- [ ] **Step 2: Verify the config parses**

```bash
node -e "import('./electron.vite.config.ts').catch(() => {})" || npx electron-vite build --help 2>&1 | head -5
```

No import errors expected. If `electron-vite` CLI is available, `--help` prints usage.

- [ ] **Step 3: Commit**

```bash
git add electron.vite.config.ts
git commit -m "chore(electron): add electron.vite.config.ts"
```

---

## Task 3: Update tsconfig.node.json for Electron type support

**Files:**
- Modify: `tsconfig.node.json`

This gives the IDE TypeScript hints for Electron APIs when editing `electron/main.ts`.

- [ ] **Step 1: Update tsconfig.node.json**

Replace the `"types"` and `"include"` entries in `tsconfig.node.json`:

Before:
```json
    "types": ["node"],
```
After:
```json
    "types": ["node", "electron"],
```

Before:
```json
  "include": ["vite.config.ts"]
```
After:
```json
  "include": ["vite.config.ts", "electron.vite.config.ts", "electron/**/*"]
```

- [ ] **Step 2: Verify TypeScript compiles without errors**

```bash
npx tsc --project tsconfig.node.json --noEmit 2>&1 | head -20
```

Expected: no output (no errors). Ignore any "Cannot find module 'electron'" if electron types aren't installed yet — they were installed in Task 1 so this should be clean.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.node.json
git commit -m "chore(electron): extend tsconfig.node.json with electron types"
```

---

## Task 4: Create electron/preload.ts

**Files:**
- Create: `electron/preload.ts`

The preload script runs in the renderer's Chromium context before the page loads. No custom APIs are needed right now — the Web Notifications API covers our use case without IPC.

- [ ] **Step 1: Create the preload script**

```bash
mkdir -p electron
```

Create `electron/preload.ts`:

```ts
import { contextBridge } from 'electron'

// No custom APIs exposed — Web Notifications API is available directly in the renderer.
// Extend contextBridge here when native IPC is needed in future.
contextBridge.exposeInMainWorld('electronAPI', {})
```

- [ ] **Step 2: Commit**

```bash
git add electron/preload.ts
git commit -m "chore(electron): add minimal preload script"
```

---

## Task 5: Create electron/main.ts

**Files:**
- Create: `electron/main.ts`

This is the Electron main process. It creates the BrowserWindow, sets up the Tray, persists window state, and manages the app lifecycle.

- [ ] **Step 1: Create electron/main.ts**

Create `electron/main.ts`:

```ts
import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'

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
      preload: join(__dirname, '../preload/index.js'),
    },
  })

  // In dev, electron-vite sets ELECTRON_RENDERER_URL to the Vite dev server
  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  win.on('resize', () => saveWindowState(win))
  win.on('move', () => saveWindowState(win))

  // Hide instead of close — quit only via tray menu
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

function createTray(win: BrowserWindow): Tray {
  const icon = nativeImage.createFromPath(getTrayIconPath())
  const tray = new Tray(
    process.platform === 'darwin' ? icon.resize({ width: 16, height: 16 }) : icon,
  )

  tray.setToolTip('Leistungserfassung')

  const menu = Menu.buildFromTemplate([
    {
      label: 'Leistungserfassung anzeigen',
      click: () => {
        win.show()
        win.focus()
      },
    },
    { type: 'separator' },
    {
      label: 'Beenden',
      click: () => app.exit(),
    },
  ])
  tray.setContextMenu(menu)

  // Toggle window on tray icon click (macOS)
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

app.whenReady().then(() => {
  const win = createWindow()
  createTray(win)

  // macOS: re-show window when clicking dock icon
  app.on('activate', () => {
    win.show()
    win.focus()
  })
})

// Keep app alive in tray — don't quit when all windows are hidden
app.on('window-all-closed', () => {
  // intentionally empty
})
```

- [ ] **Step 2: Commit**

```bash
git add electron/main.ts
git commit -m "feat(electron): add main process with BrowserWindow, Tray, and window state persistence"
```

---

## Task 6: Create placeholder icons

**Files:**
- Create: `resources/tray-icon.png`
- Create: `build/icon.icns`
- Create: `build/icon.ico`
- Create: `build/icon.png` (source for icon generation)

electron-builder auto-detects `build/icon.icns` (macOS) and `build/icon.ico` (Windows). The tray icon lives in `resources/` (main process asset).

- [ ] **Step 1: Create directories**

```bash
mkdir -p resources build
```

- [ ] **Step 2: Generate a minimal placeholder PNG (1024×1024 green square)**

Run this Python script to create `build/icon.png` — a solid green (#16a34a) square:

```bash
python3 - << 'EOF'
import struct, zlib

def png(width, height, r, g, b, path):
    def chunk(t, d):
        c = struct.pack('>I', len(d)) + t + d
        return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    raw = b''.join(b'\x00' + bytes([r, g, b]) * width for _ in range(height))
    data = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
    data += chunk(b'IDAT', zlib.compress(raw))
    data += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + data)

png(1024, 1024, 22, 163, 74, 'build/icon.png')    # green-600 app icon
png(16,   16,   22, 163, 74, 'resources/tray-icon.png')  # tray icon
print('Icons created.')
EOF
```

Expected: `Icons created.`

- [ ] **Step 3: Convert build/icon.png to ICNS (macOS) — macOS only**

On macOS, run:

```bash
mkdir -p /tmp/icon.iconset
sips -z 16 16     build/icon.png --out /tmp/icon.iconset/icon_16x16.png
sips -z 32 32     build/icon.png --out /tmp/icon.iconset/icon_16x16@2x.png
sips -z 32 32     build/icon.png --out /tmp/icon.iconset/icon_32x32.png
sips -z 64 64     build/icon.png --out /tmp/icon.iconset/icon_32x32@2x.png
sips -z 128 128   build/icon.png --out /tmp/icon.iconset/icon_128x128.png
sips -z 256 256   build/icon.png --out /tmp/icon.iconset/icon_128x128@2x.png
sips -z 256 256   build/icon.png --out /tmp/icon.iconset/icon_256x256.png
sips -z 512 512   build/icon.png --out /tmp/icon.iconset/icon_256x256@2x.png
sips -z 512 512   build/icon.png --out /tmp/icon.iconset/icon_512x512.png
cp build/icon.png /tmp/icon.iconset/icon_512x512@2x.png
iconutil -c icns /tmp/icon.iconset -o build/icon.icns
echo "ICNS created: $(ls -lh build/icon.icns | awk '{print $5}')"
```

Expected: `ICNS created: <size>K`

- [ ] **Step 4: Create ICO (Windows) — works on any platform**

Run this Python script to create a minimal `build/icon.ico` (48×48 embedded):

```bash
python3 - << 'EOF'
import struct, zlib

def png_bytes(width, height, r, g, b):
    def chunk(t, d):
        c = struct.pack('>I', len(d)) + t + d
        return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    raw = b''.join(b'\x00' + bytes([r, g, b]) * width for _ in range(height))
    data = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
    data += chunk(b'IDAT', zlib.compress(raw))
    data += chunk(b'IEND', b'')
    return b'\x89PNG\r\n\x1a\n' + data

# Build ICO with one 48x48 image (PNG inside ICO)
img = png_bytes(48, 48, 22, 163, 74)
header = struct.pack('<HHH', 0, 1, 1)           # ICO header: reserved, type=1, count=1
entry = struct.pack('<BBBBHHII', 48, 48, 0, 0, 1, 32, len(img), 6 + 16)  # directory entry
with open('build/icon.ico', 'wb') as f:
    f.write(header + entry + img)
print('ICO created.')
EOF
```

Expected: `ICO created.`

- [ ] **Step 5: Commit**

```bash
git add resources/ build/
git commit -m "chore(electron): add placeholder icons (tray, app icon ICNS + ICO)"
```

---

## Task 7: Create electron-builder.yml

**Files:**
- Create: `electron-builder.yml`

- [ ] **Step 1: Create electron-builder.yml**

Create `electron-builder.yml` at the project root:

```yaml
appId: de.leistungserfassung.app
productName: Leistungserfassung

directories:
  output: release/

files:
  - out/**/*

extraResources:
  - from: resources/
    to: .

mac:
  icon: build/icon.icns
  category: public.app-category.productivity
  target:
    - target: dmg
    - target: zip

win:
  icon: build/icon.ico
  target:
    - target: nsis

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

- [ ] **Step 2: Add out/ and release/ to .gitignore**

Append to `.gitignore`:

```
# Electron build output
out/
release/
```

- [ ] **Step 3: Commit**

```bash
git add electron-builder.yml .gitignore
git commit -m "chore(electron): add electron-builder.yml and gitignore entries for build output"
```

---

## Task 8: Create useStopwatchNotification hook with tests

**Files:**
- Create: `src/hooks/useStopwatchNotification.ts`
- Create: `src/hooks/__tests__/useStopwatchNotification.test.ts`

The hook reads `activeTimer.startedAt` from `useTimerStore` and fires a native desktop notification exactly once when elapsed time crosses 2 hours. The `notifiedRef` ensures only one notification per timer session.

- [ ] **Step 1: Write the failing test**

Create `src/hooks/__tests__/useStopwatchNotification.test.ts`:

```ts
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStopwatchNotification } from '../useStopwatchNotification'
import { useTimerStore } from '../../stores/timer'

const DRAFT = { client: 'Test', orderNo: '1', account: 'DEV' }
const TWO_HOURS_MS = 2 * 60 * 60 * 1000

describe('useStopwatchNotification', () => {
  beforeEach(() => {
    useTimerStore.setState({ activeTimer: null })
    vi.stubGlobal('Notification', vi.fn())
  })

  it('fires notification when timer has run for over 2 hours', () => {
    const startedAt = Date.now() - TWO_HOURS_MS - 1000
    useTimerStore.setState({ activeTimer: { startedAt, draft: DRAFT } })

    renderHook(() => useStopwatchNotification())

    expect(Notification).toHaveBeenCalledOnce()
    expect(Notification).toHaveBeenCalledWith('Leistungserfassung', {
      body: 'Stoppuhr läuft seit 2 Stunden',
    })
  })

  it('does not fire notification before 2 hours', () => {
    const startedAt = Date.now() - 60 * 60 * 1000 // 1 hour ago
    useTimerStore.setState({ activeTimer: { startedAt, draft: DRAFT } })

    renderHook(() => useStopwatchNotification())

    expect(Notification).not.toHaveBeenCalled()
  })

  it('does not fire when no timer is active', () => {
    renderHook(() => useStopwatchNotification())
    expect(Notification).not.toHaveBeenCalled()
  })

  it('fires only once per timer session even on multiple renders', () => {
    const startedAt = Date.now() - TWO_HOURS_MS - 1000
    useTimerStore.setState({ activeTimer: { startedAt, draft: DRAFT } })

    const { rerender } = renderHook(() => useStopwatchNotification())
    rerender()
    rerender()

    expect(Notification).toHaveBeenCalledOnce()
  })

  it('resets notification when timer stops and restarts', () => {
    const startedAt1 = Date.now() - TWO_HOURS_MS - 1000
    useTimerStore.setState({ activeTimer: { startedAt: startedAt1, draft: DRAFT } })
    const { rerender } = renderHook(() => useStopwatchNotification())

    // Stop timer
    useTimerStore.setState({ activeTimer: null })
    rerender()

    // Start new timer that also exceeds 2 hours
    const startedAt2 = Date.now() - TWO_HOURS_MS - 2000
    useTimerStore.setState({ activeTimer: { startedAt: startedAt2, draft: DRAFT } })
    rerender()

    expect(Notification).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npx vitest run src/hooks/__tests__/useStopwatchNotification.test.ts 2>&1 | tail -15
```

Expected: `FAIL` — "Cannot find module '../useStopwatchNotification'"

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useStopwatchNotification.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
npx vitest run src/hooks/__tests__/useStopwatchNotification.test.ts 2>&1 | tail -15
```

Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useStopwatchNotification.ts src/hooks/__tests__/useStopwatchNotification.test.ts
git commit -m "feat(electron): add useStopwatchNotification hook — fires desktop notification after 2h"
```

---

## Task 9: Integrate useStopwatchNotification in App.tsx

**Files:**
- Modify: `src/App.tsx`

The hook must run while the authenticated user is active — call it at the top of the `App` component (inside `AuthProvider`). It is a no-op when `activeTimer` is null, so it's safe to call unconditionally.

- [ ] **Step 1: Add import and hook call to App.tsx**

In `src/App.tsx`, add one import and one hook call:

```ts
// Add this import alongside the existing imports:
import { useStopwatchNotification } from './hooks/useStopwatchNotification'
```

Inside the `App` function body, add the hook call as the first line:

```ts
export default function App() {
  useStopwatchNotification()   // ← add this line
  const { user, loading } = useAuth()
  // ... rest unchanged
```

- [ ] **Step 2: Run all unit tests to confirm nothing is broken**

```bash
npx vitest run 2>&1 | tail -10
```

Expected: all tests pass (including the 5 new notification tests).

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(electron): integrate useStopwatchNotification into App"
```

---

## Task 10: Smoke test — run the app in Electron dev mode

**Files:** none

- [ ] **Step 1: Start the Electron dev build**

```bash
npm run electron:dev
```

Expected: Vite dev server starts, then an Electron window opens with the Leistungserfassung app.

- [ ] **Step 2: Verify login works**

Log in with a Firebase email/password account. The main screen should load with Firestore data — identical to the web app experience.

- [ ] **Step 3: Verify tray icon**

- **macOS:** A small icon should appear in the menu bar (top right). Right-click shows the context menu with „Leistungserfassung anzeigen" and „Beenden". Clicking the X button hides the window; clicking the tray icon shows it again.
- **Windows:** The icon should appear in the system tray (bottom right taskbar). Same context menu behavior.

- [ ] **Step 4: Verify window state persists**

Resize and move the window. Quit via tray → Beenden. Restart with `npm run electron:dev`. The window should open at the same size and position.

- [ ] **Step 5: Verify desktop notification (optional — requires a timer running 2h)**

Start a timer in the app. To test without waiting 2 hours, temporarily lower `THRESHOLD_MS` in `useStopwatchNotification.ts` to `10_000` (10 seconds), save, let HMR reload, start a timer, wait 10 seconds. A system notification „Stoppuhr läuft seit 2 Stunden" should appear. Revert `THRESHOLD_MS` to `2 * 60 * 60 * 1000` and commit.

- [ ] **Step 6: Commit smoke test confirmation**

No code changes expected unless you lowered THRESHOLD_MS for testing — revert it first, then:

```bash
git status  # should be clean
```

---

## Task 11: Build and package (optional — run on target platform)

**Files:** none

- [ ] **Step 1: Build for macOS (run on macOS)**

```bash
npm run dist:mac
```

Expected: `release/Leistungserfassung-1.0.0.dmg` and `release/Leistungserfassung-1.0.0-mac.zip` created.

- [ ] **Step 2: Install and test the DMG**

Open `release/Leistungserfassung-1.0.0.dmg`, drag to Applications, right-click → Open (first launch Gatekeeper bypass), confirm the app runs correctly.

- [ ] **Step 3: Build for Windows (run on Windows)**

```bash
npm run dist:win
```

Expected: `release/Leistungserfassung Setup 1.0.0.exe` created. Run it, accept SmartScreen warning, install, and confirm the app opens.
