import type { AllPRs, ExercisePRs, RepPR, Settings, CompletedWorkout } from "./types";

const PRS_KEY = "forge_prs_v1";
const SETTINGS_KEY = "forge_settings_v1";
const HISTORY_KEY = "forge_workouts_v1";

// ──────────── Settings ────────────

export function loadSettings(): Settings {
  if (typeof window === "undefined") return { unit: "lb", username: "Athlete" };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { unit: "lb", username: "Athlete" };
    const parsed = JSON.parse(raw) as Settings;
    return {
      unit: parsed.unit === "kg" ? "kg" : "lb",
      username: parsed.username ?? "Athlete",
    };
  } catch {
    return { unit: "lb", username: "Athlete" };
  }
}

export function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ──────────── PRs ────────────

export function loadPRs(): AllPRs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PRS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AllPRs;
  } catch {
    return {};
  }
}

export function savePRs(prs: AllPRs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRS_KEY, JSON.stringify(prs));
}

export function updatePR(
  prs: AllPRs,
  exerciseId: string,
  exerciseName: string,
  reps: number,
  weightLb: number,
  when: number
): AllPRs {
  if (reps < 1 || reps > 15 || weightLb <= 0) return prs;
  const current: ExercisePRs = prs[exerciseId] ?? { exerciseId, exerciseName, byReps: {} };
  const existing: RepPR | undefined = current.byReps[reps];
  if (!existing || weightLb > existing.weightLb) {
    return {
      ...prs,
      [exerciseId]: {
        ...current,
        exerciseName,
        byReps: {
          ...current.byReps,
          [reps]: { reps, weightLb, date: when },
        },
      },
    };
  }
  return prs;
}

// ──────────── History ────────────

export function loadHistory(): CompletedWorkout[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CompletedWorkout[];
  } catch {
    return [];
  }
}

export function saveHistory(history: CompletedWorkout[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/** Save a completed workout and update PRs atomically. */
export function saveCompletedWorkout(workout: CompletedWorkout) {
  const history = loadHistory();
  saveHistory([workout, ...history]);

  let prs = loadPRs();
  for (const ae of workout.exercises) {
    for (const set of ae.sets) {
      if (!set.completed) continue;
      const weight = parseFloat(set.weight) || 0;
      const reps = parseInt(set.reps) || 0;
      prs = updatePR(prs, ae.exercise.id, ae.exercise.name, reps, weight, workout.date);
    }
  }
  savePRs(prs);
}

// ──────────── Unit conversion ────────────

export function lbToKg(lb: number): number {
  return Math.round((lb * 0.45359237 + Number.EPSILON) * 10) / 10;
}

export function kgToLb(kg: number): number {
  return Math.round((kg / 0.45359237 + Number.EPSILON) * 10) / 10;
}
