<h1 align="center">Simple Workout App</h1>
<p align="center">Lightweight, client‑side workout tracker with animated exercise icons, PR logging (1–15 reps), warm‑up set insertion, and theme support.</p>

## ✨ Features
- Select, reorder, and customize exercises (add your own)
- Plan sets (target reps + weight + rest) and edit mid‑workout
- Per‑exercise rest overrides (with fallback to a default)
- Insert ad‑hoc warm‑up sets at the top during the workout
- Rest timer with audio beep when complete
- Automatic PR tracking (per exercise × reps 1–15)
- Workout history (most recent 100 sessions) stored locally
- Unit toggle (lb / kg) with conversion
- Themes: Ocean, Sunset, Forest, White, or No theme
- Animated SVG exercise illustrations (reduced-motion aware)
- Input UX: auto‑select values on focus for fast typing
- Accessibility: ARIA live region cues
- Local persistence via `localStorage` only (no backend)

## 🧱 Tech Stack
- Next.js 15 (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS v4
- LocalStorage (no external DB)

## 🚀 Getting Started

Install dependencies (if not already):
```bash
npm install
```

Run dev server:
```bash
npm run dev
```
Then visit: http://localhost:3000

## 📁 Key Structure
```
src/
	app/
		page.tsx        # Main UI: setup, workout flow, state management
		prs/page.tsx    # Personal records view
		history/page.tsx# Workout history
		error.tsx       # Runtime error boundary page
	lib/
		storage.ts      # Load/save PRs, settings, history, conversions
		types.ts        # Shared type definitions
		useCountdown.ts # Reusable countdown hook
public/
	media/exercises/           # Monochrome animated SVGs
	media/exercises/colored/   # Color variants for White theme
```

## 🏃‍♂️ Workout Flow Overview
1. Select and configure exercises (sets, reps, weight, per‑exercise rest)
2. Begin workout → direct to input screen
3. Submit a set → timer auto starts (can still enter next set while resting)
4. Add warm-up set at any time (prepends new row)
5. PRs silently update in the background
6. Completing final set saves a session snapshot to history

## 🧮 Personal Records
Each exercise tracks best weight for each rep count 1–15. Updating occurs automatically after logging a set (no extra UI interaction needed).

## 💾 Persistence
All data (settings, PRs, history) lives in `localStorage`. Clearing browser storage resets the app. No network calls are performed.

## 🎨 Themes & Media
Theme choice changes background gradients (or pure white / none). White theme switches to colored SVGs with bold black outlines for clarity.

## ♿ Accessibility
- ARIA live region announces phase changes (start, rest, completion)
- Reduced motion preference respected (disables SVG animation)

## 🛠 Development Notes
- Warm-up set insertion uses an internal offset to keep completed results aligned.
- State is intentionally colocated in `page.tsx` to keep complexity low—can be refactored into slices/hooks if app expands.
- No server components are used; everything is client-side for simplicity.
 - Rest countdown is started after each submission using the next exercise's `restSeconds` override if provided, otherwise the global default. We no longer auto-reset the timer when the default changes mid-session.
 - Buttons: “Submit Set” and “New Workout” share the same theme-aware styling for visual consistency.

## 🔐 Privacy
All data is local to the user’s browser. No tracking or external storage.

## 📦 Production Build
```bash
npm run build
npm start
```

## 🐛 Issues / Ideas
Open a GitHub issue for feature requests (e.g. charts, export, supersets, RPE tracking).

## 🤝 Contributing
1. Fork & clone
2. Create a feature branch
3. Commit with clear messages
4. Open a PR describing changes & rationale

## 📄 License
Add a LICENSE file (MIT recommended). If you want, ask and a template can be added.

---
For a deeper architectural orientation, see `agents.md` (for new contributors / automation agents).

Enjoy the lifts! 🏋️
