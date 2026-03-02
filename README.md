<h1 align="center">IronLog</h1>
<p align="center">A sharp, mobile-first workout tracker with rest timers, PR logging, and session history. No backend — all data lives in your browser.</p>

## Features

- **Exercise selection** — pick from defaults or add your own; drag to reorder
- **Per-set planning** — configure sets, target reps, starting weight, and rest per exercise
- **Live workout flow** — log reps & weight, rest timer auto-starts between sets with audio beep
- **PR tracking** — best weight per exercise × rep count (1–15 reps), updated silently after each set
- **Session history** — last 100 sessions with per-exercise volume totals
- **Insert warm-up sets** — add a set at the top of any exercise mid-workout
- **Unit toggle** — lb / kg with on-the-fly conversion
- **Total workout timer** — elapsed time badge during active sessions
- **Themes** — Ocean (default), Sunset, Forest, White, System
- **Mobile-first responsive** — fixed bottom action bar, large tap targets, no number spinners
- **Accessibility** — ARIA live region announces phase changes
- **Privacy** — no network calls; `localStorage` only

## Tech Stack

- Next.js 15 (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS v4

## Getting Started

```bash
npm install
npm run dev
```

Then visit: http://localhost:3000

## Key Structure

```
src/
  app/
    page.tsx          # Main UI: setup, workout flow, all state management
    prs/page.tsx      # Personal records — best weight per rep range
    history/page.tsx  # Session history with volume stats
    layout.tsx        # Root layout, metadata, viewport
    globals.css       # Design tokens, input reset, glass-card utility
    error.tsx         # Runtime error boundary
  lib/
    storage.ts        # Load/save PRs, settings, history; unit conversions
    types.ts          # Shared type definitions
    useCountdown.ts   # Reusable countdown hook
public/
  media/exercises/          # Monochrome animated SVGs
  media/exercises/colored/  # Color variants for White theme
```

## Design System

All pages share a consistent set of theme-aware CSS class helpers derived from `settings.theme`:

| Variable | Role |
|----------|------|
| `cardCls` | Card surface (glass on dark themes, white on light) |
| `inputCls` | Form input background and border |
| `mutedCls` | De-emphasized text |
| `fgCls` | Primary text |
| `sectionHeadCls` | Section label (uppercase, tight tracking) |
| `navPillCls` | Header nav button |
| `headerCls` | Sticky header background |

Dark themes (Ocean / Sunset / Forest) use glassmorphism: `bg-white/[0.07] border border-white/10 backdrop-blur-sm`.
White theme uses plain card surfaces: `bg-white border border-gray-200`.

## Workout Flow

1. **Setup** — select exercises, configure sets/reps/weight/rest; drag to reorder
2. **Begin** — taps "Start Workout" in the fixed bottom bar
3. **Log** — enter reps & weight, tap "Log Set"; rest timer starts automatically
4. **Rest** — timer shown inline; color-coded (indigo = counting, amber = time's up)
5. **Next set** — auto-advances; logging and resting happen on the same screen
6. **Done** — session saved to history, PRs updated, volume summary shown

## Personal Records

Best weight for each (exercise, rep count) pair from 1–15 reps. Updated automatically after every set. Viewable at `/prs` with a "best lift" highlight and full rep-range grid.

## History

Each session stores: date, rest setting, unit at time, and all sets (reps, weightLb, timestamp). Volume totals are computed on the history page. Viewable at `/history`. Last 100 sessions retained.

## Persistence

All data lives in `localStorage` under three keys:

| Key | Contents |
|-----|----------|
| `workoutapp_prs_v1` | PR records by exercise × reps |
| `workoutapp_settings_v1` | Unit preference and theme |
| `workoutapp_history_v1` | Array of session snapshots |

Clearing browser storage resets the app. No export/import yet — see roadmap.

## Roadmap / Known Gaps

- [ ] Last-session reference shown while logging (biggest training aid missing)
- [ ] Workout templates (save & reuse configurations)
- [ ] Progress charts (weight over time per exercise)
- [ ] Data export / import (JSON backup)
- [ ] Progressive overload suggestions
- [ ] 1RM estimator
- [ ] Bodyweight + added weight support (weighted dips, etc.)
- [ ] Muscle group filtering
- [ ] Plate calculator
- [ ] Workout notes / session rating
- [ ] PWA / push notifications for rest timer

## Development Notes

- `iconsOff = true` in `page.tsx` suppresses SVG exercise icons in cards (toggle to re-enable).
- `nextSet()` is defined but currently unused — `recordSet()` handles all advancement logic.
- Warm-up set insertion uses `resultsOffset` to keep completed results aligned with rows after prepending.
- Rest countdown uses the next exercise's `restSeconds` override if set, otherwise the global default. Timer is not auto-reset when the global default changes mid-session.
- State is intentionally colocated in `page.tsx` for simplicity; extract to hooks/slices if complexity grows.

## Privacy

All data is local to the user's browser. No tracking, analytics, or external requests.

## Production Build

```bash
npm run build
npm start
```

## Contributing

1. Fork & clone
2. Create a feature branch
3. Commit with clear messages
4. Open a PR with a description of changes and rationale

See `agents.md` for a deeper architectural orientation intended for new contributors and automation agents.

## License

MIT recommended — add a `LICENSE` file if publishing publicly.
