# Electron Desktop App — Design Spec

**Datum:** 2026-06-01  
**Status:** Approved  
**Scope:** Leistungserfassung als native Desktop-App für Windows und macOS

---

## 1. Ziel

Die bestehende Leistungserfassung Web-App (React 19 + Vite + Firebase) wird als Electron-Desktop-App für macOS und Windows verpackt. Die gesamte Funktionalität — inklusive Firebase Email/Passwort-Auth und Firestore-Datenhaltung — bleibt identisch. Zusätzlich erhält die App ein System-Tray-Icon und Desktop-Benachrichtigungen.

---

## 2. Projektstruktur

Der bestehende `src/`-Code bleibt vollständig unverändert. Neue Dateien:

```
leistungserfassung/
├── electron/
│   ├── main.ts            # Main-Prozess: Window, Tray, App-Lifecycle
│   └── preload.ts         # Context Bridge (minimal, kein IPC nötig)
├── build/
│   ├── icon.icns          # Mac App-Icon (512×512 Quelle)
│   ├── icon.ico           # Windows App-Icon
│   └── tray-icon.png      # Tray-Icon (Template-Style für Mac, farbig für Windows)
├── electron.vite.config.ts   # Electron-Build-Config (trennt Main von Renderer)
├── electron-builder.yml      # Packaging-Konfiguration
├── vite.config.ts            # UNVERÄNDERT — Web-Build bleibt funktionstüchtig
└── package.json              # Erweitert: neue Scripts + electron-Deps
```

---

## 3. Technologie-Entscheidungen

| Komponente | Tool | Begründung |
|---|---|---|
| Build-System | `electron-vite` | Native Vite-Integration, Hot Reload für Main + Renderer |
| Packaging | `electron-builder` | Cross-Platform .dmg + NSIS, breit etabliert |
| Firebase Auth | Unverändert | Email/Passwort läuft in Chromium-Renderer ohne Änderungen |
| Notifications | Web Notifications API | Kein IPC nötig, direkt im React-Code nutzbar |
| Code-Signing | Keines | Interne Nutzung, Gatekeeper/SmartScreen manuell bypassen |
| Auto-Update | Keines | Manuelle Distribution |

---

## 4. Main-Prozess (`electron/main.ts`)

### BrowserWindow
- Startgröße: **1280×800px**, Minimum: **900×600px**
- Native OS-Titelleiste (kein custom titlebar)
- Fenstergröße und -position werden beim Schließen gespeichert und beim nächsten Start wiederhergestellt (via `app.getPath('userData')` + JSON-Datei)
- Im Dev-Modus: lädt `http://localhost:5173` (Vite Dev Server); im Prod-Modus: lädt gebautes `dist/index.html`

### App-Lifecycle
- **X-Button schließen:** versteckt das Fenster (`win.hide()`), beendet die App **nicht**
- **Tray → Beenden:** `app.quit()` — echter Quit
- **Mac Dock-Klick:** zeigt Fenster wieder an (`win.show()`)
- **Mac `window-all-closed`:** App bleibt im Hintergrund (Standard-Mac-Verhalten)

### System-Tray
- Icon: `build/tray-icon.png`
  - macOS: 16×16 Template-Icon (schwarz/transparent für Menüleiste)
  - Windows: farbiges Icon in der System-Taskleiste
- **Klick auf Icon (Mac):** Toggle — Fenster anzeigen oder verstecken
- **Rechtsklick-Kontextmenü (beide Plattformen):**
  ```
  Leistungserfassung anzeigen   → win.show() + win.focus()
  ─────────────────────────────
  Beenden                       → app.quit()
  ```

### Desktop-Benachrichtigungen
- Wird direkt in der Renderer-Seite (React) über die Web Notifications API ausgelöst:
  ```ts
  new Notification('Leistungserfassung', { body: 'Stoppuhr läuft seit 2 Stunden' })
  ```
- Kein IPC zwischen Main und Renderer erforderlich
- Electron aktiviert Notifications-Permission automatisch für die eigene App

---

## 5. Preload-Script (`electron/preload.ts`)

Minimales Preload ohne Custom-IPC — nur das Standard-Boilerplate von electron-vite:

```ts
import { contextBridge } from 'electron'
// Keine custom APIs nötig — Web Notifications API reicht für den aktuellen Scope
```

Falls zukünftig IPC benötigt wird (z.B. native Menüs, Dateisystem-Zugriff), wird hier die `contextBridge` erweitert.

---

## 6. Firebase-Integration

Die bestehende Firebase-Konfiguration (`src/services/firebase.ts`) bleibt unverändert.

- **Env-Variablen:** `VITE_*`-Variablen werden von Vite zur Build-Zeit eingebettet
  - Dev: aus `.env.local`
  - Prod-Build: als CLI-Umgebungsvariablen gesetzt (z.B. `VITE_FIREBASE_API_KEY=... npm run electron:build`)
- **Auth:** Email/Passwort-Signin läuft im Chromium-Renderer identisch wie im Browser
- **Firestore:** Direktverbindung zu Production-Firestore (kein Emulator in Electron-Prod-Build)
- **Emulator:** Im Dev-Modus wird `VITE_USE_EMULATOR=true` wie gehabt gesetzt

---

## 7. Packaging (`electron-builder.yml`)

```yaml
appId: de.leistungserfassung.app
productName: Leistungserfassung

directories:
  output: release/

files:
  - dist/**/*           # gebaute Renderer-Dateien
  - dist-electron/**/*  # gebauter Main-Prozess

mac:
  icon: build/icon.icns
  category: public.app-category.productivity
  target:
    - dmg
    - zip

win:
  icon: build/icon.ico
  target:
    - nsis

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

**Code-Signing:** Keines. Interner Workflow für Erststart:
- **macOS:** Rechtsklick auf `.app` → „Öffnen" → Gatekeeper-Warnung bestätigen (einmalig)
- **Windows:** SmartScreen-Warnung beim ersten Start → „Weitere Informationen" → „Trotzdem ausführen"

---

## 8. Neue npm-Scripts

```json
{
  "electron:dev":   "electron-vite dev",
  "electron:build": "electron-vite build",
  "dist:mac":       "electron-vite build && electron-builder --mac",
  "dist:win":       "electron-vite build && electron-builder --win"
}
```

Bestehende Scripts (`dev`, `build`, `test`, `lint`, `emulators`) bleiben **unverändert**.

---

## 9. Neue Abhängigkeiten

```json
{
  "devDependencies": {
    "electron": "^36.x",
    "electron-vite": "^3.x",
    "electron-builder": "^25.x"
  }
}
```

Keine neuen Runtime-Dependencies — Electron selbst ist die Runtime.

---

## 10. Icons

Für den MVP werden einfache Icons akzeptiert. Anforderungen:

| Datei | Format | Größe | Zweck |
|---|---|---|---|
| `build/icon.icns` | ICNS | 512×512 Quelle | macOS App-Icon (Dock, Finder) |
| `build/icon.ico` | ICO | Multi-Size (256,48,32,16) | Windows App-Icon |
| `build/tray-icon.png` | PNG | 16×16 (Mac) / 16×16 (Win) | Tray-Icon |

electron-builder kann aus einer einzigen `build/icon.png` (1024×1024) automatisch alle Formate generieren wenn `electron-icon-builder` verwendet wird.

---

## 11. Nicht im Scope

- Auto-Update (electron-updater)
- Code-Signing / Notarisierung
- Native Menüleiste (macOS menu bar) anpassen
- Offline-Modus / lokale Datensicherung
- GitLab CI für Electron-Builds (optionaler Follow-up)
