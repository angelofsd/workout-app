# Agent Orientation: FORGE Workout App

This document is for new automation agents or contributors who need a fast, *actionable* mental model of the codebase so they can safely extend it.

## 1. Core Purpose
A purely client-side workout tracker: pick a template or start blank → add exercises → log sets (weight + reps) → auto-track PRs (1–15 reps) → save session history. No backend; everything persists in `localStorage`.

## 2. High-Level Architecture
```
src/app/page.tsx              # Home dashboard (stats strip, quick-start, recent sessions, bottom nav)
src/app/workout/page.tsx      # Active workout (live timer, exercise cards, set logging, finish modal)
src/app/workout/templates/    # Template picker (6 prebuilt programs)
src/app/prs/                  # PR listing (podium top-3, sortable flat list)
src/app/history/              # Session history (expandable cards with set breakdown)
src/app/settings/             # Profile (username, lb/kg toggle)
src/app/error.tsx             # Error boundary page (surfaces white screens)
src/lib/types.ts              # All shared domain types
src/lib/storage.ts            # localStorage persistence + PR extraction
src/lib/exercises.ts          # 59-exercise catalog, categories, color map, 6 workout templates
```

## 3. Key Data Shapes (see `types.ts` for exact definitions)
- `Exercise`: `{ id, name, category, equipment }`
- `WorkoutSet`: `{ id, weight: string, reps: string, completed: boolean }`
- `ActiveExercise`: `{ instanceId, exercise: Exercise, sets: WorkoutSet[] }`
- `CompletedWorkout`: `{ id, name, date: number (epoch ms), exercises: ActiveExercise[], duration: number (ms) }`
- `RepPR`: `{ reps, weightLb, date }` — best weight for a given rep count
- `ExercisePRs`: `{ exerciseId, exerciseName, byReps: Record<number, RepPR> }`
- `AllPRs`: `Record<exerciseId, ExercisePRs>`
- `Settings`: `{ unit: 'lb' | 'kg', username: string }`

## 4. Design System
- **Brand**: FORGE
- **Background**: `bg-zinc-950` (base), `bg-zinc-900` (cards)
- **Borders**: `border-zinc-800`
- **Accent**: `text-orange-500` / `bg-orange-500`
- **Cards**: `rounded-2xl`
- **Icons**: `lucide-react`
- **Animations**: `motion/react` (framer-motion v11+)
- No dynamic theming — single dark theme throughout

## 5. Routing (Next.js App Router)
| URL | File | Notes |
|-----|------|-------|
| `/` | `src/app/page.tsx` | Home dashboard |
| `/workout` | `src/app/workout/page.tsx` | Blank workout; uses `useSearchParams` (wrapped in `<Suspense>`) |
| `/workout?template=<id>` | same | Pre-populates exercises from a template |
| `/workout/templates` | `src/app/workout/templates/page.tsx` | Template picker |
| `/prs` | `src/app/prs/page.tsx` | Personal records |
| `/history` | `src/app/history/page.tsx` | Session history |
| `/settings` | `src/app/settings/page.tsx` | Profile + preferences |

## 6. Storage Layer (`src/lib/storage.ts`)
**Keys**: `forge_prs_v1`, `forge_settings_v1`, `forge_workouts_v1`

Key functions:
- `loadSettings()` / `saveSettings(settings)` — unit + username
- `loadPRs()` / `savePRs(prs)` — raw PR map
- `loadHistory()` / `saveHistory(history)` — array of `CompletedWorkout`
- `saveCompletedWorkout(workout)` — **preferred save path**: atomically appends to history AND extracts PRs for every completed set in one call
- `updatePR(prs, exerciseId, exerciseName, reps, weightLb, when)` — pure function; only updates if new weight is a record for that rep count
- `lbToKg(lb)` / `kgToLb(kg)` — unit conversion helpers

## 7. Exercise Catalog (`src/lib/exercises.ts`)
- `EXERCISES`: 59 exercises, each with `{ id, name, category, equipment }`
- `CATEGORIES`: `['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio']`
- `CATEGORY_COLORS`: Tailwind class strings per category for badge coloring
- `WORKOUT_TEMPLATES`: 6 templates — Push Day, Pull Day, Leg Day, Upper Body, Full Body, Core Blast — each with `{ id, name, description, exerciseIds[] }`

## 8. Active Workout Flow (`src/app/workout/page.tsx`)
1. Page reads `?template=<id>` from search params; if present, pre-populates `exercises` state from the matching template (3 default sets each)
2. Live elapsed timer increments every second via `setInterval`
3. Each `ActiveExercise` holds its own `WorkoutSet[]`; sets track weight string, reps string, and completed boolean
4. "Add Exercise" opens a bottom sheet (`ExerciseSheet`) with search + category filter
5. "Finish" opens `FinishModal` → on confirm calls `saveCompletedWorkout()` then navigates to `/`
6. Workout name is editable inline in the sticky header

## 9. PR Logic
- Tracked per exercise per rep count (1–15 reps only)
- `updatePR()` is a pure function — only updates when the new weight exceeds the existing record
- `saveCompletedWorkout()` calls `updatePR` for every completed set automatically
- Weight stored internally always in **lb**; `lbToKg` / `kgToLb` used at display time when `settings.unit === 'kg'`

## 10. Adding a New Feature (Guideline)
Example: Add RPE (Rate of Perceived Exertion) per set.
1. Extend `WorkoutSet` in `types.ts` with `rpe?: number`
2. Add an RPE input inside `SetRow` in `workout/page.tsx`
3. `saveCompletedWorkout` will persist it automatically (data flows through `ActiveExercise`)
4. Display in `history/page.tsx` set breakdown if desired
5. Decide whether RPE should influence PR logic (probably not initially)

## 11. Potential Refactors
- Extract a `useWorkout` hook from the large `WorkoutPageInner` component
- Memoize `ExerciseCard` and `SetRow` with `React.memo` for large exercise lists
- Add optimistic local state updates in storage functions

## 12. Testing Strategy (Proposed)
Currently no automated tests. If added:
- Unit: `storage.ts` helpers (`updatePR`, conversion functions)
- Unit: `exercises.ts` — validate all template `exerciseIds` reference valid `EXERCISES` entries
- Component: `WorkoutPage` — set addition, completion toggle, finish flow
- Accessibility: ARIA announcements on phase transitions

## 13. Performance Notes
- All state is client-resident; re-renders are limited to within the workout page component
- `useCallback` wraps `updateSet`, `addSet`, `removeExercise` to avoid unnecessary re-renders

## 14. Security & Privacy
- No external calls; no secrets. Only risk surface is localStorage key collision or manual tampering.

## 15. Quick Start for Agents
```
1. npm install
2. npm run dev         # http://localhost:3000
3. Main pages: src/app/**/page.tsx
4. Data model: src/lib/types.ts
5. Persistence: src/lib/storage.ts (always call saveCompletedWorkout to finish a workout)
6. Exercise data: src/lib/exercises.ts
```

## 16. Glossary
- *Template*: A predefined set of exercises (named program like "Push Day") stored in `WORKOUT_TEMPLATES`
- *ActiveExercise*: An exercise instance within a workout session, with its own sets array
- *CompletedWorkout*: A finished session stored in history (contains all `ActiveExercise` snapshots)
- *RepPR*: Best weight ever recorded for exactly N reps of a given exercise

## 17. LocalStorage Keys
- `forge_settings_v1` — `Settings` object
- `forge_prs_v1` — `AllPRs` map
- `forge_workouts_v1` — `CompletedWorkout[]` array

## 18. Support & Contact
Open a GitHub Issue with feature / defect description. Provide reproduction steps (browser + exact sequence of clicks) when reporting bugs.

---
This doc should let a new agent make safe, targeted improvements within minutes. Update it whenever the domain model changes.
