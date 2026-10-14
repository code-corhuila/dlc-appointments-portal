# Changelog

All notable changes to `dlc-appointments-portal` are documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/). Releases are prepared from `main` on `release/<version>` branches. Approved changes in `qa` are reapplied with `git cherry-pick -x`, each release reaches `main` through a Pull Request, and the `v<version>` tag is created after the release is merged.

## [Unreleased]

### Added

- Initial `CHANGELOG.md` to record future project changes.

## [2.0.0] - 2026-10-13

MVP 2 (Cut 2) — DI LUCCA Appointments Portal. Initial integrated release of the dental appointments portal, providing a demonstrable Angular frontend for scheduling, availability, appointment lifecycle actions, and calendar workflows.

### Added

- Angular portal foundation with Native Federation configuration, a shell integration contract, controlled shell navigation, and explicit mount, route-update, leave, and unmount lifecycle support.
- HU-APT-001 appointment scheduling interface with active-patient search and selection, injectable dentist directory support, availability lookup, date and time-slot selection, clinic time-zone configuration, form validation, and success, validation, authorization, conflict, service-error, loading, empty-state, and retry feedback.
- Duplicate-submission protection and stale-response safeguards for patient searches and availability requests.
- Dentist availability management with schedule and shift controls, date and interval validation, version-aware saving, clinic time-zone handling, and loading, error, and empty states.
- HU-APT-002 demonstration appointment lifecycle actions: confirmation, cancellation, rescheduling, attention start, no-show recording, and completion, with visual appointment-status updates.
- HU-APT-003 dentist personal calendar with assigned appointment and status presentation.
- HU-APT-004 administrative calendar and demonstration clinical assignments, including calendar support data, waiting-list interactions, and synthetic appointment data.
- Calendar improvements: a new-appointment action, scheduling navigation, month and week views, daily appointment previews, time ranges, additional-appointment indicators, chronological ordering, appointment selection, and preview dismissal through Escape, outside interaction, and interface controls.
- Automated test configuration with Vitest, continuous integration for dependency installation, tests, and production builds, plus Docker and Nginx delivery configuration.
- Native Federation deployment support, including cache controls for portal assets and security headers for static delivery.

### Changed

- Refined portal structure and routing to support standalone and shell-composed execution modes.
- Improved calendar presentation, navigation, daily appointment visibility, and demonstrative appointment scheduling flow.
- Separated reusable appointment, availability, calendar, time-zone, error-normalization, and idempotency responsibilities into typed frontend services and domain utilities.
- Updated the Nginx Content Security Policy to support Native Federation scripts.

### Fixed

- Preserved consistent patient and dentist selections during scheduling.
- Validated availability intervals and protected calendar dates.
- Normalized API error feedback for validation, forbidden, conflict, service-unavailable, and generic scheduling failures.
- Ignored stale patient-search and availability responses and handled malformed availability data.
- Routed not-found navigation through the shell in composed mode.
- Prevented Native Federation portal assets from falling back to the Angular index document.

### Known Limits

- Some scheduling workflows use demonstration services and in-memory storage; appointments created through those services are not guaranteed to be persisted by a backend.
- Some calendar sections use synthetic patients and appointments for demonstration purposes.
- Real dentist-directory integration remains pending in selected workflows.
- Full integration with backend microservices is not implemented for every feature.
- The frontend does not directly manage authentication tokens, sessions, or the shell HTTP client.
- Release preparation recorded 20 dependency vulnerabilities: 3 moderate, 13 high, and 4 critical.
- Node.js 22 is the declared supported runtime version.
- This demonstrable frontend is not evidence of production readiness for real patient use, backend persistence, authorization, or end-to-end acceptance.

### Validation

Recorded local release-validation evidence for 2.0.0:

- `npm ci` completed successfully.
- 37 test files and 256 automated tests passed; 0 tests failed.
- `npm run build` completed successfully.
- Non-blocking CSS size warnings were reported for Calendar and Scheduling.
- The content comparison between `qa` and `release/2.0.0` reported no differences during release preparation.
- Approved changes were promoted with `git cherry-pick -x`.

These are recorded local release-validation results. They do not claim a successful GitHub Actions release run, nor do they establish backend or end-to-end integration.

[Unreleased]: https://github.com/code-corhuila/dlc-appointments-portal/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/code-corhuila/dlc-appointments-portal/releases/tag/v2.0.0
