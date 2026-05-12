# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- [LEIS-30] Docker-Image (Multi-Stage: node:22-alpine → nginx:1.27-alpine) mit Security-Headers, Gzip und SPA-Routing; GitLab CI baut und pusht das Image in die Registry; Portainer-Stack in `deploy/`
- [LEIS-18] CSV-Export und -Import: Einträge als CSV herunterladen oder einlesen (Datensicherung, Browser-Transfer)
- [LEIS-16] Optional Startzeit and Endzeit fields with "Start"/"Ende" buttons; duration auto-calculated and rounded up to next 15 minutes
- [LEIS-13] Optional JIRA-Ticket and PR-Link fields added to entry form and table
- [LEIS-15] Autocomplete suggestions derived from existing entries for all form fields (except Dauer and Beschreibung)

### Fixed
- [LEIS-17] PR field is now plain text instead of a hyperlink
- [LEIS-14] Aufgabe field is no longer required
