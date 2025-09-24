export type Exercise = {
  id: string;
  name: string;
  type: "weights" | "bodyweight";
};

export type ExerciseConfig = {
  exerciseId: string;
  sets: number;
  targetReps: number;
  // Optional default weight (stored in pounds) set during setup for this workout
  weightLb?: number;
};

export type WorkoutConfig = {
  selected: ExerciseConfig[];
  restSeconds: number;
};

export type SetResult = {
  reps: number;
  weightLb: number; // store in pounds
  completedAt: number; // epoch ms
};

export type WorkoutResults = Record<string, SetResult[]>; // key = exerciseId

export type RepPR = {
  reps: number; // 1..15
  weightLb: number; // max weight achieved for this reps
  date: number; // epoch ms
};

export type ExercisePRs = {
  exerciseId: string;
  byReps: Record<number, RepPR>; // reps -> PR
};

export type AllPRs = Record<string, ExercisePRs>; // exerciseId -> prs

export type Unit = "lb" | "kg";

export type Settings = {
  unit: Unit; // global unit preference
  theme?: "ocean" | "sunset" | "forest" | "none" | "white";
};

export type WorkoutExercisePlan = {
  exerciseId: string;
  name: string; // capture name at time of workout in case list changes
  sets: { reps: number; weightLb: number; completedAt: number }[];
};

export type WorkoutSession = {
  id: string; // uuid
  date: number; // epoch ms
  restSeconds: number;
  unitAtTime: Unit;
  exercises: WorkoutExercisePlan[];
};
