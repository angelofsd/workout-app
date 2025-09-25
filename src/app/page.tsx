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
    <div className="inline-flex items-center gap-2 ml-3 align-middle">
      <span className="text-sm opacity-70">Units:</span>
      <button
        className={`px-2 py-1 rounded border ${unit === "lb" ? "bg-foreground text-background" : ""}`}
        onClick={() => onChange("lb")}
        type="button"
      >
        lb
      </button>
      <button
        className={`px-2 py-1 rounded border ${unit === "kg" ? "bg-foreground text-background" : ""}`}
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
        placeholder="Add custom exercise"
        className="border rounded px-2 py-1 flex-1"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit" className="border rounded px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10">
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
  // Per-exercise plan for each set: target reps and weight (in lb)
  const [setPlans, setSetPlans] = useState<Record<string, { targetReps: number[]; weightLb: number[] }>>({});
  // Number of sets inserted at the top after logging started; keeps results aligned with rows
  const [resultsOffset, setResultsOffset] = useState<Record<string, number>>({});
  const [liveMessage, setLiveMessage] = useState<string>("");

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
    setRepsInput(0);
    // Prefill weight from configured default if present
    const first = plan[0];
    const prefillLb = first?.weightLb ?? 0;
    setWeightLb(prefillLb);
    setWeightText(prefillLb === 0 ? "" : (settings.unit === "kg" ? String(Math.round(lbToKg(prefillLb) * 10) / 10) : String(prefillLb)));
    // Ensure timer isn't showing rest before first set
    reset(0);
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
    setRepsInput(0);
    // Use per-exercise rest override if provided, otherwise fall back to global default
    const restForNext = cfg?.restSeconds ?? restSeconds;
    reset(restForNext);
    start();
    beepArmed.current = true;
    announce("Rest started");
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

  return (
    <div className={`min-h-screen p-6 sm:p-10 ${
      settings.theme === "none"
        ? ""
        : settings.theme === "sunset"
        ? "bg-gradient-to-b from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30"
        : settings.theme === "forest"
        ? "bg-gradient-to-b from-emerald-100 to-lime-100 dark:from-emerald-900/30 dark:to-lime-900/30"
        : settings.theme === "white"
        ? "bg-white text-black"
        : "bg-gradient-to-b from-sky-100 to-indigo-100 dark:from-sky-900/30 dark:to-indigo-900/30"
    }`}>
      <div className="mb-6 grid gap-2 place-items-center text-center">
        <h1 className="text-2xl sm:text-3xl font-bold">Simple Workout App</h1>
        <nav className="flex items-center gap-3 text-sm flex-wrap justify-center">
          <Link href="/prs" className="underline-offset-4 hover:underline">PRs</Link>
          <span className="opacity-50">|</span>
          <Link href="/history" className="underline-offset-4 hover:underline">History</Link>
          <span className="opacity-50">|</span>
          <label className="inline-flex items-center gap-2">
            <span className="opacity-70">Theme:</span>
            <select
              className="theme-select border rounded px-2 py-1 bg-white text-black [color-scheme:light]"
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
              <option value="none">No theme</option>
              <option value="white">White</option>
            </select>
          </label>
        </nav>
      </div>
      <div aria-live="polite" className="sr-only">{liveMessage}</div>

      {phase === "setup" && (
        <div className="grid gap-6">
          <section className="grid gap-3">
            <h2 className="font-semibold mb-2">Select exercises</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {exercises.map((ex) => {
                const isSelected = !!selected[ex.id];
                return (
                  <button
                    key={ex.id}
                    onClick={() => toggleSelect(ex)}
                    className={`text-left rounded p-3 transition hover:bg-black/5 dark:hover:bg-white/5 shadow-sm
                      ${settings.theme === 'white'
                        ? isSelected
                          ? 'border-2 border-black'
                          : 'border-2 border-black/60'
                        : isSelected
                          ? 'border border-foreground'
                          : 'border border-black/20 dark:border-white/20'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {EXERCISE_MEDIA[ex.id] ? (
                        <Image
                          src={settings.theme === "white" ? `/media/exercises/colored/${ex.id}.svg` : EXERCISE_MEDIA[ex.id]}
                          alt=""
                          width={44}
                          height={44}
                          className={settings.theme === "white" ? "" : "filter contrast-125 brightness-110 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"}
                        />
                      ) : null}
                      <div className="font-medium">{ex.name}</div>
                    </div>
                    <div className="text-xs opacity-70">{ex.type}</div>
                    <div className="text-[11px] italic opacity-70 mt-1 leading-snug">
                      {EXERCISE_MUSCLES[ex.id] ?? (ex.type === 'bodyweight' ? 'Bodyweight compound' : 'Custom exercise')}
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Add custom exercise */}
            <AddExercise onAdd={(name) => {
              const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
              const exists = exercises.some((e) => e.id === id);
              const newEx: Exercise = { id: exists ? `${id}_${Date.now()}` : id, name, type: "weights" };
              setExercises((prev) => [...prev, newEx]);
            }} />
          </section>

          {selectedOrder.filter((id) => !!selected[id]).length > 0 && (
            <section className="grid gap-3">
              <h2 className="font-semibold">Configure sets, reps, weight, rest</h2>
              {selectedOrder
                .filter((id) => !!selected[id])
                .map((id) => selected[id]!)
                .map((cfg) => (
                <div
                  key={cfg.exerciseId}
                  className="border rounded p-3 grid sm:grid-cols-5 gap-2 items-end"
                  draggable
                  onDragStart={() => setDragId(cfg.exerciseId)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (!dragId || dragId === cfg.exerciseId) return;
                    setSelectedOrder((ord) => {
                      const next = ord.filter((x) => x !== dragId);
                      const idx = next.indexOf(cfg.exerciseId);
                      if (idx < 0) return ord;
                      next.splice(idx, 0, dragId);
                      return [...next];
                    });
                    setDragId(null);
                  }}
                  aria-grabbed={dragId === cfg.exerciseId}
                >
                  <div className="sm:col-span-1">
                    <div className="flex items-center gap-2">
                      <span className="cursor-grab select-none" title="Drag to reorder">≡</span>
                      <div>
                        <div className="text-sm opacity-70">Exercise</div>
                        <div className="font-medium">
                          {exercises.find((e) => e.id === cfg.exerciseId)?.name}
                        </div>
                      </div>
                    </div>
                  </div>
                  <label className="grid gap-1">
                    <span className="text-sm opacity-70">Sets</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="border rounded px-2 py-1"
                      value={cfg.sets}
                      onChange={(e) =>
                        updateConfig(cfg.exerciseId, { sets: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm opacity-70">Target reps</span>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      className="border rounded px-2 py-1"
                      value={cfg.targetReps}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) =>
                        updateConfig(cfg.exerciseId, { targetReps: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm opacity-70">Weight ({settings.unit})</span>
                    <input
                      type="number"
                      step={settings.unit === "kg" ? 0.5 : 1}
                      min={0}
                      max={2000}
                      className="border rounded px-2 py-1"
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
                    <span className="text-sm opacity-70">Rest (seconds)</span>
                    <input
                      type="number"
                      min={10}
                      max={600}
                      className="border rounded px-2 py-1"
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
              ))}
            </section>
          )}

          <div className="flex items-center justify-center">
            <button
              className={`mt-2 inline-flex items-center justify-center rounded-full px-6 py-3 text-base sm:text-lg font-semibold
                         border-2 shadow-lg focus:outline-none focus:ring-4
                         hover:scale-[1.02] active:scale-[0.99] transition disabled:opacity-50
                         ${settings.theme === "sunset" ? "text-white bg-pink-600 border-pink-700 hover:bg-pink-700 focus:ring-pink-400/60" : settings.theme === "forest" ? "text-white bg-emerald-600 border-emerald-700 hover:bg-emerald-700 focus:ring-emerald-400/60" : settings.theme === "none" ? "text-foreground bg-background border-foreground/30 hover:bg-black/5 dark:hover:bg-white/10 focus:ring-foreground/30" : "text-white bg-blue-600 border-blue-700 hover:bg-blue-700 focus:ring-blue-400/60"}`}
              disabled={plan.length === 0}
              onClick={beginWorkout}
            >
              Begin workout
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

      {phase !== "setup" && currentExercise && (
        <div className="grid gap-2 mt-4 place-items-center text-center">
          {active.exerciseIdx === 0 && active.setIdx === 0 ? (
            <div className="text-2xl font-bold">Begin Workout!</div>
          ) : null}
          <div className="text-lg font-semibold">
            {exercises.find((e) => e.id === currentExercise.exerciseId)?.name} — Set {active.setIdx + 1} of {totalSetsThisExercise}
          </div>
          {/* PRs hidden during workout per request */}
        </div>
      )}

      {/* Skip explicit cue screen; go straight to input on begin/next */}
      {phase === "cue" && null}

      {phase === "input" && (
        <div className="mt-6 grid gap-6">
          {/* Rest timer displayed on input screen */}
          <div className="place-self-center">
            <div className="inline-flex items-center justify-center rounded-full border-4 border-foreground/30 bg-foreground/10 px-8 py-6 shadow-md ring-2 ring-foreground/10">
              <div className="text-5xl font-bold tabular-nums tracking-widest">{secondsToMMSS(secondsLeft)}</div>
            </div>
            <div className="text-center mt-2 opacity-80">{running ? "Rest" : "Ready"}</div>
          </div>
          {/* Input controls */}
          <label className="grid gap-1">
            <span className="text-sm opacity-70">Reps performed</span>
            <input
              type="number"
              min={0}
              max={50}
              className="border rounded px-2 py-1"
              value={repsInput}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => setRepsInput(Number(e.target.value))}
            />
          </label>
                  <label className="grid gap-1">
                    <span className="text-sm opacity-70">Weight ({settings.unit})</span>
                    <input
                      type="number"
                      step={settings.unit === "kg" ? 0.5 : 1}
                      min={0}
                      max={2000}
                      className="border rounded px-2 py-1"
              value={weightText}
              placeholder="0"
              onChange={(e) => {
                const raw = e.target.value;
                setWeightText(raw);
                if (raw === "" || raw === "-") {
                  setWeightLb(0);
                  // sync into plan for current set
                  if (currentExercise) {
                    setSetPlans((prev) => {
                      const id = currentExercise.exerciseId;
                      const planFor = prev[id] ?? { targetReps: Array.from({ length: totalSetsThisExercise }, () => currentExercise.targetReps), weightLb: Array.from({ length: totalSetsThisExercise }, () => currentExercise.weightLb ?? 0) };
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
                      const planFor = prev[id] ?? { targetReps: Array.from({ length: totalSetsThisExercise }, () => currentExercise.targetReps), weightLb: Array.from({ length: totalSetsThisExercise }, () => currentExercise.weightLb ?? 0) };
                      const weights = [...planFor.weightLb];
                      weights[active.setIdx] = lb;
                      return { ...prev, [id]: { ...planFor, weightLb: weights } };
                    });
                  }
                }
              }}
                    />
                  </label>
          <button
            className={`rounded px-5 py-2.5 font-semibold transition
              border-2 focus:outline-none focus:ring-4 shadow-sm
              ${settings.theme === 'white'
                ? 'bg-black text-white border-black hover:bg-neutral-900 focus:ring-black/20'
                : 'bg-foreground text-background border-foreground hover:opacity-90 focus:ring-foreground/20'}
            w-fit inline-flex items-center justify-center place-self-center`}
            onClick={recordSet}
          >
            Submit Set
          </button>

          {/* Completed sets for this exercise */}
          <section className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Sets</h3>
              <button
                type="button"
                className="text-sm border rounded px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10"
                onClick={addSetAtTop}
                aria-label="Add set to top"
              >
                Add Set
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Set</th>
                    <th className="text-left py-2 pr-4">Reps</th>
                    <th className="text-left py-2 pr-4">Target reps</th>
                    <th className="text-left py-2 pr-4">Weight ({settings.unit})</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (!currentExercise) return null;
                    const exId = currentExercise.exerciseId;
                    const planFor = setPlans[exId] ?? { targetReps: Array.from({ length: totalSetsThisExercise }, () => currentExercise.targetReps), weightLb: Array.from({ length: totalSetsThisExercise }, () => currentExercise.weightLb ?? 0) };
                    const done = results[exId] ?? [];
                    const offset = resultsOffset[exId] ?? 0;
                    return Array.from({ length: totalSetsThisExercise }, (_, i) => {
                      const doneIdx = i - offset;
                      const isDone = doneIdx >= 0 && doneIdx < done.length;
                      const isCurrent = i === active.setIdx;
                      const targetVal = planFor.targetReps[i] ?? currentExercise.targetReps;
                      const weightLbVal = planFor.weightLb[i] ?? (currentExercise.weightLb ?? 0);
                      const weightStr = weightLbVal ? String(settings.unit === "kg" ? Math.round(lbToKg(weightLbVal) * 10) / 10 : weightLbVal) : "";
                      return (
                        <tr key={i} className="border-b last:border-0 align-middle">
                          <td className="py-2 pr-4">{i + 1}</td>
                          <td className="py-2 pr-4">
                            {isDone ? (
                              <span>{done[doneIdx].reps}</span>
                            ) : isCurrent ? (
                              <input
                                type="number"
                                min={0}
                                max={50}
                                className="border rounded px-2 py-1 w-24"
                                value={repsInput}
                                onFocus={(e) => e.currentTarget.select()}
                                onChange={(e) => setRepsInput(Number(e.target.value))}
                              />
                            ) : (
                              <span className="opacity-50">–</span>
                            )}
                          </td>
                          <td className="py-2 pr-4">
                            <input
                              type="number"
                              min={1}
                              max={50}
                              className="border rounded px-2 py-1 w-24"
                              value={targetVal}
                              disabled={isDone}
                              onFocus={(e) => e.currentTarget.select()}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                if (!Number.isNaN(v)) {
                                  setSetPlans((prev) => {
                                    const p = prev[exId] ?? { targetReps: Array.from({ length: totalSetsThisExercise }, () => currentExercise.targetReps), weightLb: Array.from({ length: totalSetsThisExercise }, () => currentExercise.weightLb ?? 0) };
                                    const nextTargets = [...p.targetReps];
                                    nextTargets[i] = v;
                                    return { ...prev, [exId]: { ...p, targetReps: nextTargets } };
                                  });
                                }
                              }}
                            />
                          </td>
                          <td className="py-2 pr-4">
                            {isDone ? (
                              <span>{settings.unit === "kg" ? lbToKg(done[doneIdx].weightLb) : done[doneIdx].weightLb}</span>
                            ) : isCurrent ? (
                              <input
                                type="number"
                                step={settings.unit === "kg" ? 0.5 : 1}
                                min={0}
                                max={2000}
                                className="border rounded px-2 py-1 w-28"
                                value={weightText}
                                placeholder="0"
                                onFocus={(e) => e.currentTarget.select()}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  setWeightText(raw);
                                  if (raw === "" || raw === "-") {
                                    setWeightLb(0);
                                    setSetPlans((prev) => {
                                      const p = prev[exId] ?? { targetReps: Array.from({ length: totalSetsThisExercise }, () => currentExercise.targetReps), weightLb: Array.from({ length: totalSetsThisExercise }, () => currentExercise.weightLb ?? 0) };
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
                                      const p = prev[exId] ?? { targetReps: Array.from({ length: totalSetsThisExercise }, () => currentExercise.targetReps), weightLb: Array.from({ length: totalSetsThisExercise }, () => currentExercise.weightLb ?? 0) };
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
                                className="border rounded px-2 py-1 w-28"
                                value={weightStr}
                                placeholder="0"
                                onFocus={(e) => e.currentTarget.select()}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  setSetPlans((prev) => {
                                    const p = prev[exId] ?? { targetReps: Array.from({ length: totalSetsThisExercise }, () => currentExercise.targetReps), weightLb: Array.from({ length: totalSetsThisExercise }, () => currentExercise.weightLb ?? 0) };
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
          </section>
        </div>
      )}

      {phase === "rest" && null}

      {phase === "done" && (
        <div className="mt-8 grid gap-4">
          <div className="text-2xl font-semibold">Workout complete!</div>
          <section className="grid gap-2">
            {plan.map((cfg) => {
              const name = exercises.find((e) => e.id === cfg.exerciseId)?.name;
              const sets = results[cfg.exerciseId] ?? [];
              return (
                <div key={cfg.exerciseId} className="border rounded p-3">
                  <div className="font-semibold mb-2">{name}</div>
                  <ul className="text-sm grid gap-1">
                    {sets.map((s, i) => (
                      <li key={i}>
                        Set {i + 1}: {s.reps} reps @ {settings.unit === "kg" ? lbToKg(s.weightLb) : s.weightLb} {settings.unit}
                      </li>)
                    )}
                  </ul>
                </div>
              );
            })}
          </section>
          <button
            className={`rounded px-5 py-2.5 font-semibold transition
              border-2 focus:outline-none focus:ring-4 shadow-sm
              ${settings.theme === 'white'
                ? 'bg-black text-white border-black hover:bg-neutral-900 focus:ring-black/20'
                : 'bg-foreground text-background border-foreground hover:opacity-90 focus:ring-foreground/20'}
              w-fit inline-flex items-center justify-center`}
            onClick={() => setPhase("setup")}
          >
            New Workout
          </button>
        </div>
      )}
    </div>
  );
}