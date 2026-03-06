import type { Exercise } from "./types";

export { type Exercise };

export const EXERCISES: Exercise[] = [
  // Chest
  { id: "e1", name: "Bench Press", category: "Chest", equipment: "Barbell" },
  { id: "e2", name: "Incline Bench Press", category: "Chest", equipment: "Barbell" },
  { id: "e3", name: "Decline Bench Press", category: "Chest", equipment: "Barbell" },
  { id: "e4", name: "Dumbbell Fly", category: "Chest", equipment: "Dumbbell" },
  { id: "e5", name: "Push-Up", category: "Chest", equipment: "Bodyweight" },
  { id: "e6", name: "Cable Fly", category: "Chest", equipment: "Cable" },
  { id: "e7", name: "Chest Dip", category: "Chest", equipment: "Bodyweight" },
  { id: "e8", name: "Dumbbell Pullover", category: "Chest", equipment: "Dumbbell" },
  // Back
  { id: "e9", name: "Deadlift", category: "Back", equipment: "Barbell" },
  { id: "e10", name: "Pull-Up", category: "Back", equipment: "Bodyweight" },
  { id: "e11", name: "Lat Pulldown", category: "Back", equipment: "Cable" },
  { id: "e12", name: "Barbell Row", category: "Back", equipment: "Barbell" },
  { id: "e13", name: "Seated Cable Row", category: "Back", equipment: "Cable" },
  { id: "e14", name: "T-Bar Row", category: "Back", equipment: "Barbell" },
  { id: "e15", name: "Single Arm Dumbbell Row", category: "Back", equipment: "Dumbbell" },
  { id: "e16", name: "Chin-Up", category: "Back", equipment: "Bodyweight" },
  { id: "e17", name: "Straight Arm Pulldown", category: "Back", equipment: "Cable" },
  // Shoulders
  { id: "e18", name: "Overhead Press", category: "Shoulders", equipment: "Barbell" },
  { id: "e19", name: "Dumbbell Shoulder Press", category: "Shoulders", equipment: "Dumbbell" },
  { id: "e20", name: "Lateral Raise", category: "Shoulders", equipment: "Dumbbell" },
  { id: "e21", name: "Front Raise", category: "Shoulders", equipment: "Dumbbell" },
  { id: "e22", name: "Arnold Press", category: "Shoulders", equipment: "Dumbbell" },
  { id: "e23", name: "Face Pull", category: "Shoulders", equipment: "Cable" },
  { id: "e24", name: "Upright Row", category: "Shoulders", equipment: "Barbell" },
  // Arms
  { id: "e25", name: "Barbell Curl", category: "Arms", equipment: "Barbell" },
  { id: "e26", name: "Dumbbell Curl", category: "Arms", equipment: "Dumbbell" },
  { id: "e27", name: "Hammer Curl", category: "Arms", equipment: "Dumbbell" },
  { id: "e28", name: "Preacher Curl", category: "Arms", equipment: "Barbell" },
  { id: "e29", name: "Concentration Curl", category: "Arms", equipment: "Dumbbell" },
  { id: "e30", name: "Tricep Pushdown", category: "Arms", equipment: "Cable" },
  { id: "e31", name: "Skull Crusher", category: "Arms", equipment: "Barbell" },
  { id: "e32", name: "Overhead Tricep Extension", category: "Arms", equipment: "Dumbbell" },
  { id: "e33", name: "Close-Grip Bench Press", category: "Arms", equipment: "Barbell" },
  { id: "e34", name: "Tricep Dip", category: "Arms", equipment: "Bodyweight" },
  // Legs
  { id: "e35", name: "Squat", category: "Legs", equipment: "Barbell" },
  { id: "e36", name: "Front Squat", category: "Legs", equipment: "Barbell" },
  { id: "e37", name: "Leg Press", category: "Legs", equipment: "Machine" },
  { id: "e38", name: "Lunge", category: "Legs", equipment: "Bodyweight" },
  { id: "e39", name: "Romanian Deadlift", category: "Legs", equipment: "Barbell" },
  { id: "e40", name: "Leg Curl", category: "Legs", equipment: "Machine" },
  { id: "e41", name: "Leg Extension", category: "Legs", equipment: "Machine" },
  { id: "e42", name: "Calf Raise", category: "Legs", equipment: "Machine" },
  { id: "e43", name: "Hack Squat", category: "Legs", equipment: "Machine" },
  { id: "e44", name: "Goblet Squat", category: "Legs", equipment: "Dumbbell" },
  // Core
  { id: "e45", name: "Plank", category: "Core", equipment: "Bodyweight" },
  { id: "e46", name: "Crunch", category: "Core", equipment: "Bodyweight" },
  { id: "e47", name: "Russian Twist", category: "Core", equipment: "Bodyweight" },
  { id: "e48", name: "Leg Raise", category: "Core", equipment: "Bodyweight" },
  { id: "e49", name: "Ab Wheel Rollout", category: "Core", equipment: "Equipment" },
  { id: "e50", name: "Cable Crunch", category: "Core", equipment: "Cable" },
  { id: "e51", name: "Dead Bug", category: "Core", equipment: "Bodyweight" },
  { id: "e52", name: "Hanging Knee Raise", category: "Core", equipment: "Bodyweight" },
  // Cardio
  { id: "e53", name: "Treadmill Run", category: "Cardio", equipment: "Machine" },
  { id: "e54", name: "Rowing Machine", category: "Cardio", equipment: "Machine" },
  { id: "e55", name: "Jump Rope", category: "Cardio", equipment: "Equipment" },
  { id: "e56", name: "Burpee", category: "Cardio", equipment: "Bodyweight" },
  { id: "e57", name: "Battle Ropes", category: "Cardio", equipment: "Equipment" },
  { id: "e58", name: "Box Jump", category: "Cardio", equipment: "Equipment" },
  { id: "e59", name: "Cycling", category: "Cardio", equipment: "Machine" },
];

export const CATEGORIES = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Cardio",
];

export const CATEGORY_COLORS: Record<string, string> = {
  Chest: "text-red-400 bg-red-400/10",
  Back: "text-blue-400 bg-blue-400/10",
  Shoulders: "text-purple-400 bg-purple-400/10",
  Arms: "text-yellow-400 bg-yellow-400/10",
  Legs: "text-green-400 bg-green-400/10",
  Core: "text-orange-400 bg-orange-400/10",
  Cardio: "text-pink-400 bg-pink-400/10",
};

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exerciseIds: string[];
  color: string;
  emoji: string;
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "t1",
    name: "Push Day",
    description: "Chest · Shoulders · Triceps",
    exerciseIds: ["e1", "e2", "e18", "e20", "e30", "e31"],
    color: "from-red-500/20 to-orange-500/10",
    emoji: "🔥",
  },
  {
    id: "t2",
    name: "Pull Day",
    description: "Back · Biceps",
    exerciseIds: ["e9", "e11", "e12", "e25", "e27"],
    color: "from-blue-500/20 to-cyan-500/10",
    emoji: "💪",
  },
  {
    id: "t3",
    name: "Leg Day",
    description: "Quads · Hamstrings · Calves",
    exerciseIds: ["e35", "e37", "e40", "e41", "e42"],
    color: "from-green-500/20 to-emerald-500/10",
    emoji: "🦵",
  },
  {
    id: "t4",
    name: "Upper Body",
    description: "Full Upper Body",
    exerciseIds: ["e1", "e12", "e18", "e25", "e30"],
    color: "from-purple-500/20 to-violet-500/10",
    emoji: "⚡",
  },
  {
    id: "t5",
    name: "Full Body",
    description: "Total Body Strength",
    exerciseIds: ["e1", "e9", "e35", "e18", "e45"],
    color: "from-yellow-500/20 to-amber-500/10",
    emoji: "🏋️",
  },
  {
    id: "t6",
    name: "Core Blast",
    description: "Core · Abs · Stability",
    exerciseIds: ["e45", "e46", "e47", "e48", "e50", "e52"],
    color: "from-orange-500/20 to-red-500/10",
    emoji: "🎯",
  },
];
