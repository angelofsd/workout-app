export type Unit = "lb" | "kg";

export type Settings = {
  unit: Unit;
  username: string;
};

// Rich exercise with category and equipment
export type Exercise = {
  id: string;
  name: string;
  category: string;
  equipment: string;
};

// Active workout types
export type WorkoutSet = {
  id: string;
  weight: string; // free-form string input
  reps: string;
  completed: boolean;
};

export type ActiveExercise = {
  instanceId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
};

export type CompletedWorkout = {
  id: string;
  name: string;
  date: number; // epoch ms
  exercises: ActiveExercise[];
  duration: number; // seconds
};

// PR tracking — best weight per rep count (1-15 reps)
export type RepPR = {
  reps: number;
  weightLb: number;
  date: number; // epoch ms
};

export type ExercisePRs = {
  exerciseId: string;
  exerciseName: string;
  byReps: Record<number, RepPR>; // reps -> PR
};

export type AllPRs = Record<string, ExercisePRs>;
