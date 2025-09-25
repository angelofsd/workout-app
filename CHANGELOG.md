# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning when versioned releases are made.

- Keep a Changelog: https://keepachangelog.com/en/1.1.0/
- Semantic Versioning: https://semver.org/spec/v2.0.0.html

## [Unreleased]
- Documentation: Expanded README with architecture/flow, added `agents.md` for new contributors.

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

[Unreleased]: https://github.com/angelofsd/workout-app/compare/main...HEAD
[0.1.0]: https://github.com/angelofsd/workout-app/tree/main