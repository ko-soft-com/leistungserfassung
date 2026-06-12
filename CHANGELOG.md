# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Globale Quick-Add-Leiste unterhalb der AppHeader: Buttons zum schnellen Anlegen von Zeiteinträgen, Jira-Tickets, Pull Requests und Aufgaben ohne Seitenwechsel
- `QuickAddZeitModal`: vollständiges Zeiterfassungsformular mit `useDraft`-Hook (Auftraggeber, Auftragsnr., Zeitkonto, Start/Ende, Task-Typ, Beschreibung, JIRA-Ticket, PR, Issue-Typ)
- `QuickAddJiraModal`: vollständiges Jira-Formular (Nummer, Titel, Typ, Status, Fälligkeit, Beschreibung, Kommentar)
- `QuickAddPrModal`: vollständiges PR-Formular (Nummer, Titel, Status, Reviewer, Fälligkeit, Kommentar)
- `QuickAddTaskModal`: vollständiges Aufgaben-Formular mit asynchron geladenen Jira/PR-Dropdowns (Titel, Status, Von/Bis, Fälligkeit, Beschreibung)
- `useRefreshStore`: Zustand-Store mit Versions-Countern je Entity; nach erfolgreichem Speichern im Modal wird die zugehörige Page automatisch neu geladen

## [1.6.0] - 2026-06-04

### Added
- Jira-Ticket-Verwaltung: eigene Seite mit CRUD (Name, Status, Kommentar), erreichbar über Sidebar-Navigation
- Pull-Request-Verwaltung: eigene Seite mit CRUD (Name, Status, Kommentar), erreichbar über Sidebar-Navigation
- Sidebar-Navigation mit drei Einträgen (Zeiterfassung, Jira-Tickets, Pull Requests)
- Zeiteintrags-Verknüpfung: Jira-Tickets und PRs zeigen gebuchte Stunden und Eintrags-Historie beim Aufklappen
- Status-Werte Jira: Offen, In Progress, In Code Review, Done
- Status-Werte PRs: Draft, Open, Merged, Closed

## [1.5.0]

### Added
- [LEIS-30] Docker-Image (Multi-Stage: node:22-alpine → nginx:1.27-alpine) mit Security-Headers, Gzip und SPA-Routing; GitLab CI baut und pusht das Image in die Registry; Portainer-Stack in `deploy/`
- [LEIS-18] CSV-Export und -Import: Einträge als CSV herunterladen oder einlesen (Datensicherung, Browser-Transfer)
- [LEIS-16] Optional Startzeit and Endzeit fields with "Start"/"Ende" buttons; duration auto-calculated and rounded up to next 15 minutes
- [LEIS-13] Optional JIRA-Ticket and PR-Link fields added to entry form and table
- [LEIS-15] Autocomplete suggestions derived from existing entries for all form fields (except Dauer and Beschreibung)

### Fixed
- [LEIS-17] PR field is now plain text instead of a hyperlink
- [LEIS-14] Aufgabe field is no longer required
