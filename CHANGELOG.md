# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning when versioned releases are made.

- Keep a Changelog: https://keepachangelog.com/en/1.1.0/
- Semantic Versioning: https://semver.org/spec/v2.0.0.html

## [Unreleased]

## [0.2.0] - 2026-03-02
### Added
- IronLog branding — renamed from "Simple Workout App" throughout
- Mobile viewport meta (`maximum-scale=1`) to fix scaling on iOS/Android
- CSS design-token variables (`--background`, `--foreground`, `--card`, `--muted`, `--accent`) in `globals.css`
- Global number-input spinner removal (webkit + moz) for cleaner mobile UX
- Exercise type badges on selection cards (bodyweight = emerald, weights = blue)
- Checkmark overlay on selected exercise cards
- Per-exercise progress breadcrumb during workout (shows all exercises, highlights current, marks completed)
- Volume total per exercise on the workout-complete screen
- Elapsed duration shown on the completion screen
- Empty-state cards with CTA on History and PRs pages

### Changed
- Full UI redesign across all pages — glassmorphism cards on dark themes, clean surfaces on White/System
- Theme-aware helper class pattern (`cardCls`, `mutedCls`, `fgCls`, `sectionHeadCls`, etc.) shared across all pages
- Dark themes (Ocean, Sunset, Forest) now use deep gradient backgrounds instead of light pastels
- Sticky frosted-glass header replaces plain top section; nav as pill buttons; theme selector inline in header
- Exercise selection grid: 2-col (3-col on sm+), rounded-2xl cards with hover states
- Configure section: 2×2 / 4-col input grid per exercise, section-header labels
- Begin Workout moved to a fixed bottom bar showing exercise count
- Unit toggle redesigned as a pill segmented control
- Rest timer: color-coded states — indigo while counting, amber when time's up
- Reps / Weight inputs enlarged (4xl font, no spinners) in card containers for mobile tapping
- "Submit Set" renamed to "Log Set"
- Sets table: rounded card container, icon row markers (▶ current, ✓ done), colored row backgrounds
- History page: session cards with set count + volume stat badges; compact set pills
- PRs page: "best lift" highlight badge per exercise; rep-range grid with filled vs empty state differentiation
- README rewritten to reflect IronLog branding, new design system, updated flow, and roadmap

### Fixed
- `layout.tsx` metadata title updated from Next.js default to "IronLog — Workout Tracker"

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