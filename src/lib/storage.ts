import type { AllPRs, ExercisePRs, RepPR, Settings, WorkoutSession } from "./types";

const PRS_KEY = "workoutapp_prs_v1";
const SETTINGS_KEY = "workoutapp_settings_v1";
const HISTORY_KEY = "workoutapp_history_v1";

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

export function getExercisePRs(prs: AllPRs, exerciseId: string): ExercisePRs {
  return (
    prs[exerciseId] ?? {
      exerciseId,
      byReps: {},
    }
  );
}

export function updatePR(
  prs: AllPRs,
  exerciseId: string,
  reps: number,
  weightLb: number,
  when: number
): AllPRs {
  if (reps < 1 || reps > 15) return prs; // only track up to 15 reps
  const current = getExercisePRs(prs, exerciseId);
  const existing: RepPR | undefined = current.byReps[reps];
  if (!existing || weightLb > existing.weightLb) {
    const next: AllPRs = {
      ...prs,
      [exerciseId]: {
        exerciseId,
        byReps: {
          ...current.byReps,
          [reps]: { reps, weightLb, date: when },
        },
      },
    };
    return next;
  }
  return prs;
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return { unit: "lb" };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { unit: "lb" };
    const parsed = JSON.parse(raw) as Settings;
    const unit = parsed.unit === "kg" || parsed.unit === "lb" ? parsed.unit : "lb";
    const theme = (parsed.theme === "sunset" || parsed.theme === "forest" || parsed.theme === "none" || parsed.theme === "ocean" || parsed.theme === "white") ? parsed.theme : "ocean";
    return { unit, theme };
  } catch {
    return { unit: "lb", theme: "ocean" };
  }
}

export function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadHistory(): WorkoutSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WorkoutSession[];
  } catch {
    return [];
  }
}

export function saveHistory(history: WorkoutSession[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function lbToKg(lb: number): number {
  return Math.round((lb * 0.45359237 + Number.EPSILON) * 10) / 10;
}

export function kgToLb(kg: number): number {
  return Math.round((kg / 0.45359237 + Number.EPSILON) * 10) / 10;
}
