# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning when versioned releases are made.

- Keep a Changelog: https://keepachangelog.com/en/1.1.0/
- Semantic Versioning: https://semver.org/spec/v2.0.0.html

## [Unreleased]

## [0.1.1] - 2025-09-25
### Added
- Per-exercise rest times: each exercise can now override the default rest.
- Default Rest control in setup (fallback when an exercise has no override).
- Input polish: auto-select on focus for reps, weight, target reps, and rest values.

### Changed
- Submit Set button centered and label capitalized; New Workout button styled to match for consistency.
- Visuals: thicker card borders in White theme; colored SVGs with black outlines for clarity.

### Fixed
- Warm-up workflow: Add Set button inserts at top; fixed set numbering alignment once logging begins.
- README expanded with architecture/flow; added `agents.md` for contributors.

## [0.1.0] - 2025-09-24
### Added
- Core workout flow: select exercises, plan sets, log reps/weight, rest timer with beep.
- Personal Records tracking (best weights for reps 1–15) with local persistence.
- Workout history (latest 100 sessions) stored in the browser.
- Unit toggle (lb/kg) with on-the-fly conversion.
- Exercise management: default list, drag-and-drop ordering, and custom exercises.
- Animated SVGs for bench, squat, deadlift, overhead press, push-ups, pull-ups.
- White theme with colored icons; other gradient themes and a "No theme" option.
- Accessibility features: ARIA live announcements; reduced motion for animations.

### Changed
- Visual polish for SVGs (bolder fills/strokes), centered workout status, and improved input UX (auto-select values on focus).

### Fixed
- Squat animation cohesion and floor overlap; made figures/readability consistent across themes.

[Unreleased]: https://github.com/angelofsd/workout-app/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/angelofsd/workout-app/compare/0.1.0...v0.1.1
[0.1.0]: https://github.com/angelofsd/workout-app/tree/main