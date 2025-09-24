# Agent Orientation: Simple Workout App

This document is for new automation agents or contributors who need a fast, *actionable* mental model of the codebase so they can safely extend it.

## 1. Core Purpose
A purely client-side workout tracker: configure exercises → log sets (with rest timing) → auto-track PRs (1–15 reps) → save session history. No backend; everything persists in `localStorage`.

## 2. High-Level Architecture
```
src/app/page.tsx  # Monolithic component handling selection, workout flow, set planning, rest, logging
src/app/prs/       # PR listing page (derives from localStorage data)
src/app/history/   # Session history page
src/app/error.tsx  # Error boundary page (ensures white screens surface)
src/lib/storage.ts # All persistence & lightweight validation / migrations
src/lib/types.ts   # Shared domain types (ExerciseConfig, SetResult, PR map, etc.)
src/lib/useCountdown.ts # Encapsulated countdown hook (rest timer)
public/media/exercises/         # Monochrome animated SVGs (respect reduced motion)
public/media/exercises/colored/ # Color variants for white theme with outlines
```

## 3. Key Data Shapes (see `types.ts` for exact definitions)
- `ExerciseConfig`: { exerciseId, sets, targetReps, weightLb }
- `SetResult`: { reps, weightLb, completedAt }
- `PRs`: nested object keyed by exerciseId → reps(1..15) → { weightLb, date }
- `WorkoutSession`: persisted history snapshot after completion.
- `Settings`: { unit: 'lb' | 'kg', theme: 'ocean' | 'sunset' | 'forest' | 'none' | 'white' }

## 4. State Ownership (in `page.tsx`)
| Concern | State Variable | Notes |
|---------|----------------|-------|
| Selected exercises | `selected`, `selectedOrder` | `selected` is map, order stored separately for drag & drop |
| Exercise catalog | `exercises` | Includes defaults + user‑added custom |
| Active progression | `active` (exerciseIdx, setIdx) | Drives table highlighting |
| Phase | `phase` | 'setup' | 'input' | 'rest' | 'done' (cue skipped) |
| Set planning | `setPlans` | Per exercise arrays for target reps & weight per planned set |
| Warm-up insertion | `resultsOffset` | Shift index mapping after prepending sets |
| Logged sets | `results` | Map exerciseId → array of `SetResult` |
| PR cache | `allPRs` | Updated after each logged set (1..15 reps) |
| History | `history` | Array of prior `WorkoutSession` objects |
| Settings | `settings` | Unit & theme (persisted) |
| Countdown | `secondsLeft`, `running` from `useCountdown` | Timer displayed during input phase |
| Weight editing | `weightLb`, `weightText` | Maintains numeric + user input text representation |
| Accessibility | `liveMessage` | ARIA live region updates |

## 5. Warm-Up Set Mechanism
When the user taps "Add Set":
1. Increments `sets` on current `ExerciseConfig`.
2. Prepends default values into `setPlans[exerciseId]` arrays.
3. Increments `resultsOffset[exerciseId]` so existing `results` rows still line up visually.
4. Resets `active.setIdx` to 0.

Rendering logic uses:
```
const offset = resultsOffset[exId] ?? 0;
const doneIdx = i - offset;
const isDone = doneIdx >= 0 && doneIdx < done.length;
```

## 6. PR Logic (in `storage.ts` via `updatePR`)
- Only tracks best weight per rep count 1..15.
- Called after each set submission; updates are persisted immediately.
- UI defers display of PRs until user visits PRs page (minimal distraction during workout).

## 7. Themes & Media Handling
- Theme stored in `settings.theme`.
- If `'white'`, exercise cards load colored SVGs from `public/media/exercises/colored/`.
- Other themes use monochrome versions with CSS filters for clarity.
- Animated SVGs gate motion behind `prefers-reduced-motion` queries.

## 8. Accessibility Considerations
- Announcements done via `announce()` which briefly clears then sets `liveMessage` to trigger screen readers.
- Timer and interactive inputs keep large enough touch targets.
- Inputs auto-select content on focus for rapid editing.

## 9. Error Handling Strategy
- `error.tsx` ensures runtime issues surface inside UI instead of blank screen.
- Persistence functions perform conservative parsing; on corruption they fallback to defaults.

## 10. Adding a New Feature (Guideline)
Example: Add RPE (Rate of Perceived Exertion) per set.
1. Extend `SetResult` in `types.ts` with `rpe?: number`.
2. Update PR / history serialization in `storage.ts`.
3. Add input in set row when `isCurrent`.
4. Persist in `recordSet` and display in history.
5. Consider whether RPE influences PR logic (probably not initially).

## 11. Potential Refactors
- Extract a `WorkoutMachine` reducer to model state transitions.
- Normalize set plan + results into a dedicated hook (`useExerciseProgress`).
- Move large inline JSX blocks into smaller components (`ExerciseSelector`, `WorkoutTable`).

## 12. Testing Strategy (Proposed)
Currently no automated tests. If added:
- Unit: `storage.ts` helpers (PR updating, conversion functions).
- Component tests: warm-up insertion offset logic.
- Accessibility snapshot: ensure ARIA live region updates on phase transitions.

## 13. Performance Notes
- All state is client-resident; re-renders limited by coarse component. Acceptable for small dataset.
- Animated SVGs are small; no large image/network load.

## 14. Security & Privacy
- No external calls; no secrets. Only risk surface is localStorage key collision or manual tampering.

## 15. Quick Start for Agents
```
1. npm install
2. npm run dev
3. Modify src/app/page.tsx (main surface)
4. Check persistence logic in src/lib/storage.ts before changing structure
5. Validate localStorage keys still parse (clear storage if weird state)
```

## 16. Glossary
- *Plan*: Intended target reps + weight arrays.
- *Result*: Actual performed set (reps + weight + timestamp).
- *Offset*: Number of warm-up sets inserted after logging began; used to align arrays.

## 17. LocalStorage Keys (search in storage.ts)
- `workout_settings`
- `workout_prs`
- `workout_history`

## 18. Support & Contact
Open a GitHub Issue with feature / defect description. Provide reproduction steps (browser + exact sequence of clicks) when reporting bugs.

---
This doc should let a new agent make safe, targeted improvements within minutes. Update it whenever domain model changes.
