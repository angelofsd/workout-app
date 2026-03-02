"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Exercise, ExerciseConfig, SetResult } from "@/lib/types";
import { loadPRs, savePRs, updatePR, loadSettings, saveSettings, loadHistory, saveHistory, lbToKg, kgToLb } from "@/lib/storage";
import { useCountdown } from "@/lib/useCountdown";
import type { Unit, WorkoutSession } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";

function UnitToggle({ unit, onChange }: { unit: Unit; onChange: (u: Unit) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 p-0.5">
      <button
        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
          unit === "lb" ? "bg-white text-gray-900 shadow-sm" : "text-white/70 hover:text-white"
        }`}
        onClick={() => onChange("lb")}
        type="button"
      >
        lb
      </button>
      <button
        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
          unit === "kg" ? "bg-white text-gray-900 shadow-sm" : "text-white/70 hover:text-white"
        }`}
        onClick={() => onChange("kg")}
        type="button"
      >
        kg
      </button>
    </div>
  );
}

function AddExercise({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        onAdd(trimmed);
        setName("");
      }}
    >
      <input
        type="text"
        placeholder="Add custom exercise…"
        className="flex-1 rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm text-white placeholder-white/35 focus:border-indigo-400/60 focus:bg-white/12 transition"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        type="submit"
        className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition"
      >
        Add
      </button>
    </form>
  );
}


const DEFAULT_EXERCISES: Exercise[] = [
  { id: "bench_press", name: "Bench Press", type: "weights" },
  { id: "squat", name: "Squat", type: "weights" },
  { id: "deadlift", name: "Deadlift", type: "weights" },
  { id: "overhead_press", name: "Overhead Press", type: "weights" },
  { id: "pushups", name: "Push-ups", type: "bodyweight" },
  { id: "pullups", name: "Pull-ups", type: "bodyweight" },
];

const EXERCISE_MEDIA: Record<string, string> = {
  bench_press: "/media/exercises/bench_press.svg",
  squat: "/media/exercises/squat.svg",
  deadlift: "/media/exercises/deadlift.svg",
  overhead_press: "/media/exercises/overhead_press.svg",
  pushups: "/media/exercises/pushups.svg",
  pullups: "/media/exercises/pullups.svg",
};

// Muscles worked (brief) for display on selection cards
const EXERCISE_MUSCLES: Record<string, string> = {
  bench_press: "Chest, shoulders, triceps",
  squat: "Quads, glutes, core",
  deadlift: "Posterior chain, back, glutes",
  overhead_press: "Shoulders, triceps, upper chest",
  pushups: "Chest, shoulders, triceps, core",
  pullups: "Lats, biceps, upper back",
};

type Phase = "setup" | "cue" | "input" | "rest" | "done";

type Active = {
  exerciseIdx: number; // which exercise in plan
  setIdx: number; // which set within exercise
};

function secondsToMMSS(s: number) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${ss}`;
}

export default function WorkoutApp() {
  const iconsOff = true; // icons disabled per request
  const [exercises, setExercises] = useState<Exercise[]>(DEFAULT_EXERCISES);
  const [selected, setSelected] = useState<Record<string, ExerciseConfig>>({});
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [restSeconds, setRestSeconds] = useState<number>(90);
  const [phase, setPhase] = useState<Phase>("setup");
  const [active, setActive] = useState<Active>({ exerciseIdx: 0, setIdx: 0 });
  const [results, setResults] = useState<Record<string, SetResult[]>>({});
  const [weightLb, setWeightLb] = useState<number>(0);
  const [weightText, setWeightText] = useState<string>("");
  const [repsInput, setRepsInput] = useState<number>(0);
  const [allPRs, setAllPRs] = useState(loadPRs());
  const [settings, setSettings] = useState(loadSettings());
  const [history, setHistory] = useState(loadHistory());
  const { secondsLeft, reset, start, running } = useCountdown(restSeconds);
  const beepArmed = useRef(false);
  // Rest state to differentiate an idle 0s (ready) from an actually completed rest
  const [restState, setRestState] = useState<'idle' | 'running' | 'complete'>('idle');
  // Track countdown transitions to set restState to complete only after an actual run
  useEffect(() => {
    if (running) return; // wait for stop to evaluate separately
    // If timer just hit zero while we had been running, mark complete
    if (secondsLeft === 0 && restState === 'running') {
      setRestState('complete');
    }
  }, [secondsLeft, running, restState]);
  // Per-exercise plan for each set: target reps and weight (in lb)
  const [setPlans, setSetPlans] = useState<Record<string, { targetReps: number[]; weightLb: number[] }>>({});
  // Number of sets inserted at the top after logging started; keeps results aligned with rows
  const [resultsOffset, setResultsOffset] = useState<Record<string, number>>({});
  const [liveMessage, setLiveMessage] = useState<string>("");
  // Total workout elapsed tracking
  const [workoutStart, setWorkoutStart] = useState<number | null>(null);
  const [workoutElapsed, setWorkoutElapsed] = useState<number>(0);
  useEffect(() => {
    if (phase === "input" && workoutStart == null) setWorkoutStart(Date.now());
  }, [phase, workoutStart]);
  useEffect(() => {
    if (workoutStart == null || phase === "setup") return;
    const id = window.setInterval(() => {
      setWorkoutElapsed(Math.floor((Date.now() - workoutStart) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [workoutStart, phase]);

  function fmtElapsed(total: number) {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60).toString().padStart(2, "0");
    const s = Math.floor(total % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  }

  // Note: We no longer reset the countdown when the global default restSeconds changes,
  // because rest between sets should come from each exercise's override (when set).

  // ARIA live message helper
  const announce = (msg: string) => {
    setLiveMessage("");
    // ensure change triggers SR
    setTimeout(() => setLiveMessage(msg), 50);
  };

  const plan: ExerciseConfig[] = useMemo(() => {
    // Ordered plan derived from selection order, excluding items with no sets
    return selectedOrder
      .map((id) => selected[id])
      .filter((x): x is ExerciseConfig => !!x)
      .filter((x) => x.sets > 0);
  }, [selected, selectedOrder]);

  const currentExercise = plan[active.exerciseIdx];
  const totalSetsThisExercise = currentExercise?.sets ?? 0;

  function toggleSelect(exercise: Exercise) {
    setSelected((prev) => {
      if (prev[exercise.id]) {
        const copy = { ...prev };
        delete copy[exercise.id];
        // remove from order too
        setSelectedOrder((ord) => ord.filter((id) => id !== exercise.id));
        return copy;
      } else {
        // add to selection and append to order
        setSelectedOrder((ord) => (ord.includes(exercise.id) ? ord : [...ord, exercise.id]));
        return {
          ...prev,
          [exercise.id]: {
            exerciseId: exercise.id,
            sets: 3,
            targetReps: 10,
            weightLb: 0,
          },
        };
      }
    });
  }

  function updateConfig(id: string, patch: Partial<ExerciseConfig>) {
    setSelected((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }

  function beginWorkout() {
    if (plan.length === 0) return;
    setActive({ exerciseIdx: 0, setIdx: 0 });
    setResults({});
    // Prefill reps with target of first exercise
    const firstPlan = plan[0];
    setRepsInput(firstPlan?.targetReps ?? 0);
    // Prefill weight from configured default if present
    const first = plan[0];
    const prefillLb = first?.weightLb ?? 0;
    setWeightLb(prefillLb);
    setWeightText(prefillLb === 0 ? "" : (settings.unit === "kg" ? String(Math.round(lbToKg(prefillLb) * 10) / 10) : String(prefillLb)));
    // Ensure timer isn't showing rest before first set
    reset(0);
  setRestState('idle');
    // Initialize set plan for first exercise
    if (first) {
      setSetPlans((prev) => {
        const existing = prev[first.exerciseId];
        const count = first.sets;
        const target = Array.from({ length: count }, (_, i) => existing?.targetReps?.[i] ?? first.targetReps);
        const weights = Array.from({ length: count }, (_, i) => existing?.weightLb?.[i] ?? (first.weightLb ?? 0));
        return { ...prev, [first.exerciseId]: { targetReps: target, weightLb: weights } };
      });
      setResultsOffset((prev) => ({ ...prev, [first.exerciseId]: 0 }));
    }
    setPhase("input");
    announce("Begin working out");
  }

  function recordSet() {
    if (!currentExercise) return;
    const exId = currentExercise.exerciseId;
    const now = Date.now();
    setResults((prev) => ({
      ...prev,
      [exId]: [
        ...(prev[exId] ?? []),
        {
          reps: repsInput,
          weightLb,
          completedAt: now,
        },
      ],
    }));

    // Update PRs up to 15 reps
    const updated = updatePR(allPRs, exId, repsInput, weightLb, now);
    if (updated !== allPRs) {
      setAllPRs(updated);
      savePRs(updated);
    }

    // Advance to the next set/exercise immediately; rest countdown runs while on input UI
    const next = { ...active };
    if (next.setIdx + 1 < totalSetsThisExercise) {
      next.setIdx += 1;
    } else {
      next.exerciseIdx += 1;
      next.setIdx = 0;
    }
    if (next.exerciseIdx >= plan.length) {
      setPhase("done");
      announce("Workout complete");
      return;
    }
    const cfg = plan[next.exerciseIdx];
    // Initialize set plan for next exercise if needed
    if (cfg) {
      setSetPlans((prev) => {
        const existing = prev[cfg.exerciseId];
        const count = cfg.sets;
        const target = Array.from({ length: count }, (_, i) => existing?.targetReps?.[i] ?? cfg.targetReps);
        const weights = Array.from({ length: count }, (_, i) => existing?.weightLb?.[i] ?? (cfg.weightLb ?? 0));
        return { ...prev, [cfg.exerciseId]: { targetReps: target, weightLb: weights } };
      });
      setResultsOffset((prev) => (prev[cfg.exerciseId] == null ? { ...prev, [cfg.exerciseId]: 0 } : prev));
    }
    const planForNext = cfg ? setPlans[cfg.exerciseId] : undefined;
    const prefill = cfg ? (planForNext?.weightLb?.[next.setIdx] ?? cfg.weightLb ?? 0) : 0;
    setWeightLb(prefill);
    setWeightText(prefill === 0 ? "" : (settings.unit === "kg" ? String(Math.round(lbToKg(prefill) * 10) / 10) : String(prefill)));
    setActive(next);
    const upcomingTarget = cfg ? (setPlans[cfg.exerciseId]?.targetReps?.[next.setIdx] ?? cfg.targetReps) : 0;
    setRepsInput(upcomingTarget);
    const startingNewExercise = next.setIdx === 0 && active.exerciseIdx !== next.exerciseIdx;
    if (startingNewExercise) {
      reset(0);
      beepArmed.current = false;
      announce("Next exercise ready");
      setRestState('idle');
    } else {
      const restForNext = cfg?.restSeconds ?? restSeconds;
      reset(restForNext);
      start();
      beepArmed.current = true;
      announce("Rest started");
      setRestState('running');
    }
  }

  function nextSet() {
    // Advance set/exercise
    const next = { ...active };
    if (next.setIdx + 1 < totalSetsThisExercise) {
      next.setIdx += 1;
    } else {
      // next exercise
      next.exerciseIdx += 1;
      next.setIdx = 0;
    }
    // Decide next phase
    if (next.exerciseIdx >= plan.length) {
      setPhase("done");
      announce("Workout complete");
    } else {
      // Prefill weight from configured default when moving to a new exercise
      const cfg = plan[next.exerciseIdx];
      if (next.setIdx === 0) {
        const prefill = cfg?.weightLb ?? 0;
        setWeightLb(prefill);
        setWeightText(prefill === 0 ? "" : (settings.unit === "kg" ? String(Math.round(lbToKg(prefill) * 10) / 10) : String(prefill)));
      }
      // Ensure results offset initialized for the next exercise
      if (cfg) {
        setResultsOffset((prev) => (prev[cfg.exerciseId] == null ? { ...prev, [cfg.exerciseId]: 0 } : prev));
      }
      setPhase("input");
      announce("Begin next set");
    }
    setActive(next);
    setRepsInput(0);
  }

  // Insert a warm-up set at the top for the current exercise
  function addSetAtTop() {
    if (!currentExercise) return;
    const exId = currentExercise.exerciseId;
    // Increase total set count in selected config so UI reflects the new row
    updateConfig(exId, { sets: (currentExercise.sets ?? 0) + 1 });
    // Insert defaults at the top of set plans
    setSetPlans((prev) => {
      const count = (currentExercise.sets ?? 0) + 1; // target length after insert
      const existing = prev[exId] ?? {
        targetReps: Array.from({ length: count - 1 }, () => currentExercise.targetReps),
        weightLb: Array.from({ length: count - 1 }, () => currentExercise.weightLb ?? 0),
      };
      const nextTargets = [currentExercise.targetReps, ...existing.targetReps];
      const nextWeights = [0, ...existing.weightLb];
      return { ...prev, [exId]: { targetReps: nextTargets, weightLb: nextWeights } };
    });
    // Keep completed results aligned with rows by tracking an offset
    // Only shift offset if we already have logged results; if user hasn't logged any
    // yet, the newly inserted set should be treated as the current first set without offset.
    setResultsOffset((prev) => {
      const alreadyDone = (results[exId]?.length ?? 0) > 0;
      const current = prev[exId] ?? 0;
      return { ...prev, [exId]: alreadyDone ? current + 1 : 0 };
    });
    // Make the new top row the active set (warm-up first)
    setActive((prev) => ({ ...prev, setIdx: 0 }));
    setRepsInput(0);
    setWeightLb(0);
    setWeightText("");
    announce("Added a set at the top");
  }

  // PRs are tracked but not displayed during workout per request

  // Save session to history when workout completes
  useEffect(() => {
    if (phase !== "done") return;
    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      date: Date.now(),
      restSeconds,
      unitAtTime: settings.unit,
      exercises: plan.map((cfg) => ({
        exerciseId: cfg.exerciseId,
        name: exercises.find((e) => e.id === cfg.exerciseId)?.name ?? cfg.exerciseId,
        sets: (results[cfg.exerciseId] ?? []).map((s) => ({
          reps: s.reps,
          weightLb: s.weightLb,
          completedAt: s.completedAt,
        })),
      })),
    };
    const nextHistory = [session, ...history].slice(0, 100);
    setHistory(nextHistory);
    saveHistory(nextHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Beep when rest ends (while timer runs on input UI)
  useEffect(() => {
    if (secondsLeft !== 0 || !beepArmed.current) return;
    try {
      const AC: typeof AudioContext = (window as unknown as { AudioContext: typeof AudioContext }).AudioContext;
      const WAC = (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const Ctor = AC || WAC;
      if (!Ctor) return;
      const ctx = new Ctor();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.value = 0.1;
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 300);
    } catch {}
    beepArmed.current = false;
  }, [secondsLeft]);

  // ─── Theme helpers ────────────────────────────────────────────────────────────
  const theme = settings.theme ?? "ocean";
  const isWhite = theme === "white";
  const isNone = theme === "none";
  const isDarkTheme = !isWhite && !isNone;

  const rootBg =
    theme === "sunset"
      ? "bg-gradient-to-br from-rose-950 via-orange-950 to-amber-950"
      : theme === "forest"
      ? "bg-gradient-to-br from-emerald-950 via-green-950 to-teal-950"
      : theme === "white"
      ? "bg-white text-gray-900"
      : theme === "none"
      ? ""
      : "bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900"; // ocean

  // Card styles
  const cardCls = isWhite
    ? "bg-white border border-gray-200 shadow-sm"
    : isNone
    ? "bg-foreground/[0.04] border border-foreground/10"
    : "bg-white/[0.07] border border-white/10 backdrop-blur-sm";

  // Input styles
  const inputCls = isWhite
    ? "bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400"
    : isNone
    ? "bg-foreground/5 border border-foreground/20"
    : "bg-white/[0.08] border border-white/15 text-white placeholder-white/30";

  // Muted text
  const mutedCls = isWhite ? "text-gray-500" : isNone ? "text-foreground/50" : "text-white/50";

  // Label text
  const labelCls = isWhite ? "text-gray-600" : isNone ? "text-foreground/60" : "text-white/60";

  // Primary foreground text
  const fgCls = isWhite ? "text-gray-900" : isNone ? "text-foreground" : "text-white";

  // Section header
  const sectionHeadCls = isWhite
    ? "text-gray-400 uppercase text-[10px] font-bold tracking-widest"
    : isNone
    ? "text-foreground/40 uppercase text-[10px] font-bold tracking-widest"
    : "text-white/40 uppercase text-[10px] font-bold tracking-widest";

  // Nav pill
  const navPillCls = isWhite
    ? "text-sm px-3 py-1 rounded-full border border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
    : isNone
    ? "text-sm px-3 py-1 rounded-full border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 transition"
    : "text-sm px-3 py-1 rounded-full border border-white/15 bg-white/8 hover:bg-white/15 text-white transition";

  // Header bg
  const headerCls = isWhite
    ? "border-b border-gray-200 bg-white/90 backdrop-blur-md"
    : isNone
    ? "border-b border-foreground/10 bg-background/80 backdrop-blur-md"
    : "border-b border-white/10 bg-black/20 backdrop-blur-md";

  // ─── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <div className={`min-h-screen ${rootBg} ${isDarkTheme ? "text-white" : ""}`}>
      {/* ARIA live region */}
      <div aria-live="polite" className="sr-only">{liveMessage}</div>

      {/* Workout elapsed timer — fixed badge */}
      {phase !== "setup" && phase !== "done" && workoutStart != null && (
        <div className={`fixed top-3 right-3 z-50 flex items-center gap-1.5 text-xs font-mono font-semibold rounded-full px-3 py-1.5 shadow-lg ${
          isWhite
            ? "bg-gray-900/90 text-white"
            : "bg-black/60 backdrop-blur-md border border-white/10 text-white"
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          {fmtElapsed(workoutElapsed)}
        </div>
      )}

      {/* ── Sticky Header ── */}
      <header className={`sticky top-0 z-40 ${headerCls}`}>
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <span className={`font-black text-lg tracking-tight ${fgCls}`}>IronLog</span>

          <nav className="flex items-center gap-2 flex-wrap justify-end">
            <Link href="/prs" className={navPillCls}>PRs</Link>
            <Link href="/history" className={navPillCls}>History</Link>

            {/* Theme selector */}
            <div className="relative">
              <select
                className={`${navPillCls} pr-7 cursor-pointer`}
                value={settings.theme ?? "ocean"}
                onChange={(e) => {
                  const next = { ...settings, theme: e.target.value as typeof settings.theme };
                  setSettings(next);
                  saveSettings(next);
                }}
              >
                <option value="ocean">Ocean</option>
                <option value="sunset">Sunset</option>
                <option value="forest">Forest</option>
                <option value="none">System</option>
                <option value="white">White</option>
              </select>
              <svg
                className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 ${mutedCls}`}
                fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2}
              >
                <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </nav>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-xl mx-auto px-4">

        {/* ════════════════════════════════════════════
            SETUP PHASE
            ════════════════════════════════════════════ */}
        {phase === "setup" && (
          <div className="py-6 pb-32">

            {/* Subtitle */}
            <p className={`text-center text-sm mb-6 ${mutedCls}`}>
              Pick exercises and configure your session
            </p>

            {/* ── Exercise Selection Grid ── */}
            <section className="mb-6">
              <p className={`${sectionHeadCls} mb-3`}>Exercises</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {exercises.map((ex) => {
                  const isSelected = !!selected[ex.id];
                  return (
                    <button
                      key={ex.id}
                      onClick={() => toggleSelect(ex)}
                      className={`relative text-left rounded-2xl p-3 border-2 transition-all duration-150 ${
                        isSelected
                          ? isWhite
                            ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/10"
                            : "border-indigo-500/70 bg-indigo-500/15 shadow-lg shadow-indigo-500/10"
                          : isWhite
                          ? "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      {/* Checkmark badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shadow-sm">
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}

                      {/* Exercise icon */}
                      {!iconsOff && EXERCISE_MEDIA[ex.id] ? (
                        <Image
                          src={
                            theme === "white"
                              ? `/media/exercises/colored/${ex.id}.svg`
                              : EXERCISE_MEDIA[ex.id]
                          }
                          alt=""
                          width={36}
                          height={36}
                          className={`mb-2 ${isWhite ? "" : "opacity-90 brightness-110"}`}
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-lg mb-2 flex items-center justify-center text-sm font-bold ${
                          isWhite ? "bg-indigo-100 text-indigo-600" : "bg-white/10 text-white/60"
                        }`}>
                          {ex.name.charAt(0)}
                        </div>
                      )}

                      <div className={`font-semibold text-sm leading-tight ${fgCls}`}>{ex.name}</div>
                      <div className={`text-[10px] mt-0.5 leading-tight ${mutedCls}`}>
                        {EXERCISE_MUSCLES[ex.id] ?? (ex.type === "bodyweight" ? "Bodyweight" : "Custom")}
                      </div>
                      <div className="mt-2">
                        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          ex.type === "bodyweight"
                            ? isWhite
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-emerald-500/20 text-emerald-400"
                            : isWhite
                            ? "bg-blue-100 text-blue-700"
                            : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {ex.type}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── Add Custom Exercise ── */}
            <div className="mb-6">
              {isWhite ? (
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = (e.currentTarget.elements.namedItem("name") as HTMLInputElement);
                    const trimmed = input.value.trim();
                    if (!trimmed) return;
                    const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
                    const exists = exercises.some((e) => e.id === id);
                    const newEx: Exercise = { id: exists ? `${id}_${Date.now()}` : id, name: trimmed, type: "weights" };
                    setExercises((prev) => [...prev, newEx]);
                    input.value = "";
                  }}
                >
                  <input
                    name="name"
                    type="text"
                    placeholder="Add custom exercise…"
                    className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none transition"
                  />
                  <button
                    type="submit"
                    className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                  >
                    Add
                  </button>
                </form>
              ) : (
                <AddExercise onAdd={(name) => {
                  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
                  const exists = exercises.some((e) => e.id === id);
                  const newEx: Exercise = { id: exists ? `${id}_${Date.now()}` : id, name, type: "weights" };
                  setExercises((prev) => [...prev, newEx]);
                }} />
              )}
            </div>

            {/* ── Configure Section ── */}
            {selectedOrder.filter((id) => !!selected[id]).length > 0 && (
              <section className="mb-6">
                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                  <p className={sectionHeadCls}>Configure</p>
                  <label className={`flex items-center gap-2 text-sm ${labelCls}`}>
                    <span>Default rest</span>
                    <input
                      type="number"
                      min={10}
                      max={600}
                      className={`w-14 text-center rounded-lg px-2 py-1 text-sm ${inputCls}`}
                      value={restSeconds}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setRestSeconds(Number(e.target.value))}
                    />
                    <span>sec</span>
                  </label>
                </div>

                <div className="space-y-2">
                  {selectedOrder
                    .filter((id) => !!selected[id])
                    .map((id) => selected[id]!)
                    .map((cfg) => (
                      <div
                        key={cfg.exerciseId}
                        className={`rounded-2xl p-4 ${cardCls}`}
                        draggable
                        onDragStart={() => setDragId(cfg.exerciseId)}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnter={(e) => { e.preventDefault(); }}
                        onDrop={() => {
                          if (!dragId || dragId === cfg.exerciseId) return;
                          setSelectedOrder((ord) => {
                            const origIndex = ord.indexOf(dragId);
                            const targetIndex = ord.indexOf(cfg.exerciseId);
                            if (origIndex < 0 || targetIndex < 0) return ord;
                            const next = [...ord];
                            const [moved] = next.splice(origIndex, 1);
                            next.splice(targetIndex, 0, moved);
                            return next;
                          });
                          setDragId(null);
                        }}
                        aria-grabbed={dragId === cfg.exerciseId}
                      >
                        {/* Exercise name row */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`cursor-grab select-none text-lg leading-none ${mutedCls}`} title="Drag to reorder">⠿</span>
                          <span className={`font-semibold text-sm ${fgCls}`}>
                            {exercises.find((e) => e.id === cfg.exerciseId)?.name}
                          </span>
                        </div>

                        {/* Inputs grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <label className="grid gap-1">
                            <span className={`text-[10px] ${sectionHeadCls}`}>Sets</span>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              className={`rounded-lg px-2 py-1.5 text-sm text-center ${inputCls}`}
                              value={cfg.sets}
                              onFocus={(e) => e.currentTarget.select()}
                              onChange={(e) =>
                                updateConfig(cfg.exerciseId, { sets: Number(e.target.value) })
                              }
                            />
                          </label>

                          <label className="grid gap-1">
                            <span className={`text-[10px] ${sectionHeadCls}`}>Reps</span>
                            <input
                              type="number"
                              min={1}
                              max={15}
                              className={`rounded-lg px-2 py-1.5 text-sm text-center ${inputCls}`}
                              value={cfg.targetReps}
                              onFocus={(e) => e.currentTarget.select()}
                              onChange={(e) =>
                                updateConfig(cfg.exerciseId, { targetReps: Number(e.target.value) })
                              }
                            />
                          </label>

                          <label className="grid gap-1">
                            <span className={`text-[10px] ${sectionHeadCls}`}>Weight ({settings.unit})</span>
                            <input
                              type="number"
                              step={settings.unit === "kg" ? 0.5 : 1}
                              min={0}
                              max={2000}
                              className={`rounded-lg px-2 py-1.5 text-sm text-center ${inputCls}`}
                              value={(() => {
                                const lb = cfg.weightLb;
                                if (!lb || lb === 0) return "";
                                const v = settings.unit === "kg" ? Math.round(lbToKg(lb) * 10) / 10 : lb;
                                return String(v);
                              })()}
                              placeholder="0"
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") {
                                  updateConfig(cfg.exerciseId, { weightLb: undefined });
                                  return;
                                }
                                const v = Number(raw);
                                if (!Number.isNaN(v)) {
                                  const weightLbVal = settings.unit === "kg" ? kgToLb(v) : v;
                                  updateConfig(cfg.exerciseId, { weightLb: weightLbVal });
                                }
                              }}
                            />
                          </label>

                          <label className="grid gap-1">
                            <span className={`text-[10px] ${sectionHeadCls}`}>Rest (s)</span>
                            <input
                              type="number"
                              min={10}
                              max={600}
                              className={`rounded-lg px-2 py-1.5 text-sm text-center ${inputCls}`}
                              value={cfg.restSeconds ?? restSeconds}
                              onFocus={(e) => e.currentTarget.select()}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") {
                                  updateConfig(cfg.exerciseId, { restSeconds: undefined });
                                  return;
                                }
                                const v = Number(raw);
                                if (!Number.isNaN(v)) {
                                  updateConfig(cfg.exerciseId, { restSeconds: v });
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════
            WORKOUT HEADER (input phase)
            ════════════════════════════════════════════ */}
        {phase !== "setup" && currentExercise && (
          <div className="pt-5 pb-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                {active.exerciseIdx === 0 && active.setIdx === 0 && (
                  <p className={`text-xs font-semibold mb-0.5 ${
                    isWhite ? "text-indigo-500" : "text-indigo-400"
                  }`}>Let&apos;s go!</p>
                )}
                <h2 className={`text-2xl font-black tracking-tight leading-tight ${fgCls}`}>
                  {exercises.find((e) => e.id === currentExercise.exerciseId)?.name}
                </h2>
              </div>
              <div className={`shrink-0 rounded-xl px-3 py-2 text-center ${
                isWhite ? "bg-indigo-50 border border-indigo-200" : "bg-indigo-500/15 border border-indigo-500/30"
              }`}>
                <div className={`text-2xl font-black leading-none ${isWhite ? "text-indigo-600" : "text-indigo-300"}`}>
                  {active.setIdx + 1}
                  <span className={`text-sm font-medium ${isWhite ? "text-indigo-400" : "text-indigo-500"}`}>
                    /{totalSetsThisExercise}
                  </span>
                </div>
                <div className={`text-[10px] uppercase tracking-wider mt-0.5 ${isWhite ? "text-indigo-400" : "text-indigo-500"}`}>Set</div>
              </div>
            </div>

            {/* Exercise progress pills */}
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {plan.map((cfg, idx) => {
                const exName = exercises.find((e) => e.id === cfg.exerciseId)?.name ?? cfg.exerciseId;
                const isPast = idx < active.exerciseIdx;
                const isCurrent = idx === active.exerciseIdx;
                return (
                  <span key={cfg.exerciseId} className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${
                    isPast
                      ? isWhite ? "bg-emerald-100 text-emerald-600" : "bg-emerald-500/20 text-emerald-400"
                      : isCurrent
                      ? isWhite ? "bg-indigo-100 text-indigo-600 ring-1 ring-indigo-400" : "bg-indigo-500/25 text-indigo-300 ring-1 ring-indigo-500/50"
                      : isWhite ? "bg-gray-100 text-gray-400" : "bg-white/5 text-white/30"
                  }`}>
                    {isPast ? "✓ " : ""}{exName}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Skip explicit cue screen */}
        {phase === "cue" && null}

        {/* ════════════════════════════════════════════
            INPUT PHASE
            ════════════════════════════════════════════ */}
        {phase === "input" && (
          <div className="pb-8">

            {/* ── Rest Timer ── */}
            <div className="flex justify-center my-5">
              <div className={`rounded-2xl px-10 py-5 text-center transition-all duration-300 ${
                restState === "complete"
                  ? isWhite
                    ? "bg-amber-50 border-2 border-amber-400 shadow-lg shadow-amber-200"
                    : "bg-amber-500/10 border-2 border-amber-500/50 shadow-xl shadow-amber-500/10"
                  : running
                  ? isWhite
                    ? "bg-indigo-50 border-2 border-indigo-300 shadow-lg shadow-indigo-100"
                    : "bg-indigo-500/10 border-2 border-indigo-500/40 shadow-xl shadow-indigo-500/10"
                  : isWhite
                  ? "bg-gray-50 border-2 border-gray-200"
                  : "bg-white/5 border-2 border-white/10"
              }`}>
                <div className={`text-6xl font-black tabular-nums font-mono leading-none ${
                  restState === "complete"
                    ? isWhite ? "text-amber-500" : "text-amber-400"
                    : running
                    ? isWhite ? "text-indigo-600" : "text-indigo-400"
                    : fgCls
                }`}>
                  {secondsToMMSS(secondsLeft)}
                </div>
                <div className={`text-xs mt-2 font-medium uppercase tracking-widest ${
                  restState === "complete"
                    ? isWhite ? "text-amber-600" : "text-amber-400"
                    : mutedCls
                }`}>
                  {restState === "complete"
                    ? "Time's up — Lift now!"
                    : running
                    ? "Resting"
                    : "Ready"}
                </div>
              </div>
            </div>

            {/* ── Reps + Weight inputs ── */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`rounded-2xl p-4 ${cardCls}`}>
                <div className={`text-[10px] ${sectionHeadCls} mb-2`}>Reps performed</div>
                <input
                  type="number"
                  min={0}
                  max={50}
                  className={`w-full text-4xl font-black bg-transparent border-none outline-none leading-none ${fgCls}`}
                  value={repsInput}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => setRepsInput(Number(e.target.value))}
                />
              </div>

              <div className={`rounded-2xl p-4 ${cardCls}`}>
                <div className={`text-[10px] ${sectionHeadCls} mb-2`}>Weight ({settings.unit})</div>
                <input
                  type="number"
                  step={settings.unit === "kg" ? 0.5 : 1}
                  min={0}
                  max={2000}
                  className={`w-full text-4xl font-black bg-transparent border-none outline-none leading-none ${fgCls}`}
                  value={weightText}
                  placeholder="0"
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setWeightText(raw);
                    if (raw === "" || raw === "-") {
                      setWeightLb(0);
                      if (currentExercise) {
                        setSetPlans((prev) => {
                          const id = currentExercise.exerciseId;
                          const planFor = prev[id] ?? {
                            targetReps: Array.from({ length: totalSetsThisExercise }, () => currentExercise.targetReps),
                            weightLb: Array.from({ length: totalSetsThisExercise }, () => currentExercise.weightLb ?? 0),
                          };
                          const weights = [...planFor.weightLb];
                          weights[active.setIdx] = 0;
                          return { ...prev, [id]: { ...planFor, weightLb: weights } };
                        });
                      }
                      return;
                    }
                    const v = Number(raw);
                    if (!Number.isNaN(v)) {
                      const lb = settings.unit === "kg" ? kgToLb(v) : v;
                      setWeightLb(lb);
                      if (currentExercise) {
                        setSetPlans((prev) => {
                          const id = currentExercise.exerciseId;
                          const planFor = prev[id] ?? {
                            targetReps: Array.from({ length: totalSetsThisExercise }, () => currentExercise.targetReps),
                            weightLb: Array.from({ length: totalSetsThisExercise }, () => currentExercise.weightLb ?? 0),
                          };
                          const weights = [...planFor.weightLb];
                          weights[active.setIdx] = lb;
                          return { ...prev, [id]: { ...planFor, weightLb: weights } };
                        });
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* ── Log Set button ── */}
            <button
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg active:scale-[0.98] ${
                isWhite
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/25"
              }`}
              onClick={recordSet}
            >
              Log Set
            </button>

            {/* ── Sets Table ── */}
            <section className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <p className={sectionHeadCls}>All Sets</p>
                <button
                  type="button"
                  className={`text-xs px-3 py-1 rounded-full transition ${
                    isWhite
                      ? "border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200"
                      : "border border-white/15 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                  onClick={addSetAtTop}
                  aria-label="Add set to top"
                >
                  + Add Set
                </button>
              </div>

              <div className={`rounded-2xl overflow-hidden ${cardCls}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b ${isWhite ? "border-gray-200" : "border-white/10"}`}>
                        <th className={`text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider ${mutedCls}`}>#</th>
                        <th className={`text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider ${mutedCls}`}>Reps</th>
                        <th className={`text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider ${mutedCls}`}>Target</th>
                        <th className={`text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider ${mutedCls}`}>Weight ({settings.unit})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        if (!currentExercise) return null;
                        const exId = currentExercise.exerciseId;
                        const planFor = setPlans[exId] ?? {
                          targetReps: Array.from({ length: totalSetsThisExercise }, () => currentExercise.targetReps),
                          weightLb: Array.from({ length: totalSetsThisExercise }, () => currentExercise.weightLb ?? 0),
                        };
                        const done = results[exId] ?? [];
                        const offset = resultsOffset[exId] ?? 0;
                        return Array.from({ length: totalSetsThisExercise }, (_, i) => {
                          const doneIdx = i - offset;
                          const isDone = doneIdx >= 0 && doneIdx < done.length;
                          const isCurrent = i === active.setIdx;
                          const targetVal = planFor.targetReps[i] ?? currentExercise.targetReps;
                          const weightLbVal = planFor.weightLb[i] ?? (currentExercise.weightLb ?? 0);
                          const weightStr = weightLbVal
                            ? String(settings.unit === "kg" ? Math.round(lbToKg(weightLbVal) * 10) / 10 : weightLbVal)
                            : "";
                          return (
                            <tr
                              key={i}
                              className={`border-b last:border-0 align-middle transition-colors ${
                                isDone
                                  ? isWhite ? "bg-emerald-50/60" : "bg-emerald-500/5"
                                  : isCurrent
                                  ? isWhite ? "bg-indigo-50/80" : "bg-indigo-500/8"
                                  : ""
                              } ${isWhite ? "border-gray-100" : "border-white/5"}`}
                            >
                              <td className={`px-4 py-2.5 font-mono text-xs ${
                                isDone
                                  ? isWhite ? "text-emerald-600" : "text-emerald-400"
                                  : isCurrent
                                  ? isWhite ? "text-indigo-600 font-bold" : "text-indigo-400 font-bold"
                                  : mutedCls
                              }`}>
                                {isDone ? "✓" : isCurrent ? "▶" : i + 1}
                              </td>

                              {/* Reps cell */}
                              <td className="px-4 py-2.5">
                                {isDone ? (
                                  <span className={`font-semibold ${fgCls}`}>{done[doneIdx].reps}</span>
                                ) : isCurrent ? (
                                  <input
                                    type="number"
                                    min={0}
                                    max={50}
                                    className={`w-16 rounded-lg px-2 py-1 text-sm text-center ${inputCls}`}
                                    value={repsInput}
                                    onFocus={(e) => e.currentTarget.select()}
                                    onChange={(e) => setRepsInput(Number(e.target.value))}
                                  />
                                ) : (
                                  <span className={mutedCls}>–</span>
                                )}
                              </td>

                              {/* Target reps cell */}
                              <td className="px-4 py-2.5">
                                <input
                                  type="number"
                                  min={1}
                                  max={50}
                                  className={`w-16 rounded-lg px-2 py-1 text-sm text-center ${inputCls} disabled:opacity-50`}
                                  value={targetVal}
                                  disabled={isDone}
                                  onFocus={(e) => e.currentTarget.select()}
                                  onChange={(e) => {
                                    const v = Number(e.target.value);
                                    if (!Number.isNaN(v)) {
                                      setSetPlans((prev) => {
                                        const p = prev[exId] ?? {
                                          targetReps: Array.from({ length: totalSetsThisExercise }, () => currentExercise.targetReps),
                                          weightLb: Array.from({ length: totalSetsThisExercise }, () => currentExercise.weightLb ?? 0),
                                        };
                                        const nextTargets = [...p.targetReps];
                                        nextTargets[i] = v;
                                        if (i === active.setIdx) setRepsInput(v);
                                        return { ...prev, [exId]: { ...p, targetReps: nextTargets } };
                                      });
                                    }
                                  }}
                                />
                              </td>

                              {/* Weight cell */}
                              <td className="px-4 py-2.5">
                                {isDone ? (
                                  <span className={`font-semibold ${fgCls}`}>
                                    {settings.unit === "kg" ? lbToKg(done[doneIdx].weightLb) : done[doneIdx].weightLb}
                                  </span>
                                ) : isCurrent ? (
                                  <input
                                    type="number"
                                    step={settings.unit === "kg" ? 0.5 : 1}
                                    min={0}
                                    max={2000}
                                    className={`w-20 rounded-lg px-2 py-1 text-sm text-center ${inputCls}`}
                                    value={weightText}
                                    placeholder="0"
                                    onFocus={(e) => e.currentTarget.select()}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      setWeightText(raw);
                                      if (raw === "" || raw === "-") {
                                        setWeightLb(0);
                                        setSetPlans((prev) => {
                                          const p = prev[exId] ?? {
                                            targetReps: Array.from({ length: totalSetsThisExercise }, () => currentExercise.targetReps),
                                            weightLb: Array.from({ length: totalSetsThisExercise }, () => currentExercise.weightLb ?? 0),
                                          };
                                          const nextWeights = [...p.weightLb];
                                          nextWeights[i] = 0;
                                          return { ...prev, [exId]: { ...p, weightLb: nextWeights } };
                                        });
                                        return;
                                      }
                                      const v = Number(raw);
                                      if (!Number.isNaN(v)) {
                                        const lb = settings.unit === "kg" ? kgToLb(v) : v;
                                        setWeightLb(lb);
                                        setSetPlans((prev) => {
                                          const p = prev[exId] ?? {
                                            targetReps: Array.from({ length: totalSetsThisExercise }, () => currentExercise.targetReps),
                                            weightLb: Array.from({ length: totalSetsThisExercise }, () => currentExercise.weightLb ?? 0),
                                          };
                                          const nextWeights = [...p.weightLb];
                                          nextWeights[i] = lb;
                                          return { ...prev, [exId]: { ...p, weightLb: nextWeights } };
                                        });
                                      }
                                    }}
                                  />
                                ) : (
                                  <input
                                    type="number"
                                    step={settings.unit === "kg" ? 0.5 : 1}
                                    min={0}
                                    max={2000}
                                    className={`w-20 rounded-lg px-2 py-1 text-sm text-center ${inputCls}`}
                                    value={weightStr}
                                    placeholder="0"
                                    onFocus={(e) => e.currentTarget.select()}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      setSetPlans((prev) => {
                                        const p = prev[exId] ?? {
                                          targetReps: Array.from({ length: totalSetsThisExercise }, () => currentExercise.targetReps),
                                          weightLb: Array.from({ length: totalSetsThisExercise }, () => currentExercise.weightLb ?? 0),
                                        };
                                        const nextWeights = [...p.weightLb];
                                        if (raw === "") {
                                          nextWeights[i] = 0;
                                        } else {
                                          const v = Number(raw);
                                          if (!Number.isNaN(v)) {
                                            nextWeights[i] = settings.unit === "kg" ? kgToLb(v) : v;
                                          }
                                        }
                                        return { ...prev, [exId]: { ...p, weightLb: nextWeights } };
                                      });
                                    }}
                                  />
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        )}

        {phase === "rest" && null}

        {/* ════════════════════════════════════════════
            DONE PHASE
            ════════════════════════════════════════════ */}
        {phase === "done" && (
          <div className="py-8 pb-16">

            {/* Completion header */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                isWhite
                  ? "bg-emerald-100 border-2 border-emerald-300"
                  : "bg-emerald-500/20 border-2 border-emerald-500/40"
              }`}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className={isWhite ? "text-emerald-600" : "text-emerald-400"}>
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className={`text-3xl font-black tracking-tight mb-1 ${fgCls}`}>Session Complete</h2>
              <p className={`text-sm ${mutedCls}`}>
                {workoutStart
                  ? `Finished in ${fmtElapsed(workoutElapsed)}`
                  : "Great work today."}
              </p>
            </div>

            {/* Volume summary */}
            <div className="space-y-3 mb-8">
              {plan.map((cfg) => {
                const name = exercises.find((e) => e.id === cfg.exerciseId)?.name;
                const sets = results[cfg.exerciseId] ?? [];
                const totalVol = sets.reduce((sum, s) => sum + s.reps * (settings.unit === "kg" ? lbToKg(s.weightLb) : s.weightLb), 0);
                return (
                  <div key={cfg.exerciseId} className={`rounded-2xl p-4 ${cardCls}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`font-bold text-sm ${fgCls}`}>{name}</span>
                      {totalVol > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isWhite ? "bg-indigo-100 text-indigo-600" : "bg-indigo-500/20 text-indigo-400"
                        }`}>
                          {Math.round(totalVol).toLocaleString()} {settings.unit} vol
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {sets.map((s, i) => (
                        <div key={i} className={`flex items-center justify-between text-sm ${mutedCls}`}>
                          <span className="font-mono text-xs">Set {i + 1}</span>
                          <span className={fgCls}>
                            {s.reps} reps{s.weightLb > 0 ? ` × ${settings.unit === "kg" ? lbToKg(s.weightLb) : s.weightLb} ${settings.unit}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* New workout button */}
            <button
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${
                isWhite
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/25"
              }`}
              onClick={() => setPhase("setup")}
            >
              New Workout
            </button>
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════
          FIXED BOTTOM BAR — Setup phase only
          ════════════════════════════════════════════ */}
      {phase === "setup" && (
        <div className={`fixed bottom-0 left-0 right-0 z-40 ${
          isWhite
            ? "border-t border-gray-200 bg-white/95 backdrop-blur-md"
            : "border-t border-white/10 bg-black/30 backdrop-blur-md"
        }`}>
          <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={beginWorkout}
              disabled={plan.length === 0}
              className={`flex-1 py-3 rounded-full font-bold transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] ${
                isWhite
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 disabled:shadow-none"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/30 disabled:shadow-none"
              }`}
            >
              {plan.length === 0
                ? "Select exercises to begin"
                : `Start Workout · ${plan.length} exercise${plan.length !== 1 ? "s" : ""}`}
            </button>
            <UnitToggle
              unit={settings.unit}
              onChange={(u) => {
                const next = { unit: u } as const;
                setSettings(next);
                saveSettings(next);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
