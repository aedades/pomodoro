# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2026-02-12

### Added
- **Flow Mode** — Timer counts up from 0, no alerts, work uninterrupted until you stop
  - Enable in Settings → "Flow Mode"
  - Ring turns green when you hit target time
  - Complete pomodoro anytime after reaching target
- **Background Timer Fix** — Timer now uses end-time calculation, works correctly when app is backgrounded
- **Comprehensive Test Suite** — Added tests for:
  - Flow mode timer behavior (count up, isOverTarget, completion logic)
  - Background timer (visibility change handling)
  - Settings modal UI interactions
  - Notification hooks (permission, Firebase status)
- **Accessibility** — Added proper label associations for form inputs

### Changed
- Timer now stores `endTime` instead of counting down, survives browser backgrounding
- Settings modal inputs now have proper `htmlFor`/`id` associations

### Technical
- TDD workflow adopted for all future changes
- Tests: 100+ test cases covering core functionality
- PR-style development pattern for local changes

## [0.2.0] - 2026-02-12

### Added
- **PWA Support** — Install on home screen for app-like experience
- **iOS Detection** — Auto-detect iPhone/iPad and show setup instructions
- **Push Notification Infrastructure** — Firebase Cloud Functions for background notifications
- **Firebase Integration** — Auth, Firestore, Cloud Messaging setup
- **Multi-device Sync** — Sign in with Google to sync across devices
- **Device Detection Utilities** — `isIOS()`, `isPWA()`, `supportsWebPush()`, etc.
- **iOS Install Banner** — Prompts users to add to home screen
- **Notification Permission Flow** — Guided setup for iOS 16.4+

### Changed
- Simplified deployment to GitHub Pages (removed GCP/Cloud Run)
- Firebase SDK integration with graceful guest mode fallback
- Restructured project for frontend-first development

### Technical
- Added Vitest + React Testing Library
- Added Firebase SDK (lazy initialization)
- Added service worker for push notifications
- Added PWA manifest

## [0.1.0] - 2026-02-12

### Added
- Initial release
- Pomodoro timer with configurable durations
- Work/Short Break/Long Break modes
- Task management with projects
- Estimated vs actual pomodoro tracking
- Daily goal with progress visualization
- Dark mode
- Keyboard shortcuts (Space to start/pause)
- Sound and vibration alerts
- Guest mode with localStorage persistence
- Mobile-friendly responsive design
- Safari iOS compatibility fixes
