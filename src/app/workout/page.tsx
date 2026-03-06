"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Check, Plus, Search, Timer, Trash2, X,
} from "lucide-react";
import { EXERCISES, CATEGORIES, WORKOUT_TEMPLATES } from "@/lib/exercises";
import { saveCompletedWorkout } from "@/lib/storage";
import type { ActiveExercise, CompletedWorkout, WorkoutSet } from "@/lib/types";

// ─── helpers ───────────────────────────────────────────────────────────────

function newSet(): WorkoutSet {
  return { id: crypto.randomUUID(), weight: "", reps: "", completed: false };
}

function fmtTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── sub-components ────────────────────────────────────────────────────────

function SetRow({
  set, idx, onUpdate,
}: {
  set: WorkoutSet;
  idx: number;
  onUpdate: (patch: Partial<WorkoutSet>) => void;
}) {
  return (
    <div className={`grid grid-cols-[28px_1fr_1fr_36px] items-center gap-2 rounded-xl px-2 py-1.5 ${set.completed ? "bg-zinc-800/60" : ""}`}>
      <span className="text-center text-xs font-bold text-zinc-500">{idx + 1}</span>
      <input
        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-center text-sm text-white placeholder-zinc-600 focus:border-orange-500 focus:outline-none"
        placeholder="lbs"
        value={set.weight}
        onChange={(e) => onUpdate({ weight: e.target.value })}
      />
      <input
        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-center text-sm text-white placeholder-zinc-600 focus:border-orange-500 focus:outline-none"
        placeholder="reps"
        value={set.reps}
        onChange={(e) => onUpdate({ reps: e.target.value })}
      />
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={() => onUpdate({ completed: !set.completed })}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${set.completed ? "bg-orange-500 text-white" : "border border-zinc-600 text-zinc-600"}`}
        >
          {set.completed && <Check size={13} />}
        </button>
      </div>
    </div>
  );
}

function ExerciseCard({
  ae, onAddSet, onUpdateSet, onRemove,
}: {
  ae: ActiveExercise;
  onAddSet: () => void;
  onUpdateSet: (setId: string, patch: Partial<WorkoutSet>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div>
          <div className="font-semibold text-sm">{ae.exercise.name}</div>
          <div className="text-xs text-zinc-500">{ae.exercise.category} · {ae.exercise.equipment}</div>
        </div>
        <button onClick={onRemove} className="text-zinc-600 active:text-red-400">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="px-3 py-2 space-y-1">
        <div className="grid grid-cols-[28px_1fr_1fr_36px] gap-2 px-2 mb-1">
          <span />
          <span className="text-center text-xs text-zinc-600">Weight</span>
          <span className="text-center text-xs text-zinc-600">Reps</span>
          <span />
        </div>
        {ae.sets.map((set, idx) => (
          <SetRow
            key={set.id}
            set={set}
            idx={idx}
            onUpdate={(patch) => onUpdateSet(set.id, patch)}
          />
        ))}
        <button
          onClick={onAddSet}
          className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-orange-500 active:bg-zinc-800"
        >
          <Plus size={14} /> Add Set
        </button>
      </div>
    </div>
  );
}

// ─── exercise picker sheet ──────────────────────────────────────────────────

function ExerciseSheet({ open, onClose, onPick }: {
  open: boolean;
  onClose: () => void;
  onPick: (ex: ActiveExercise) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const filtered = EXERCISES.filter(
    (e) =>
      (cat === "All" || e.category === cat) &&
      e.name.toLowerCase().includes(q.toLowerCase())
  );

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60" onClick={onClose}>
      <div
        className="relative max-h-[80vh] flex flex-col rounded-t-2xl bg-zinc-900 border-t border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <span className="font-semibold">Add Exercise</span>
          <button onClick={onClose}><X size={20} className="text-zinc-400" /></button>
        </div>
        <div className="px-4 py-2 border-b border-zinc-800">
          <div className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5">
            <Search size={15} className="text-zinc-500" />
            <input
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
              placeholder="Search exercises…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none border-b border-zinc-800">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${cat === c ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-400"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onPick({ instanceId: crypto.randomUUID(), exercise: ex, sets: [newSet()] })}
              className="flex w-full items-center justify-between px-4 py-3 text-left active:bg-zinc-800 border-b border-zinc-800/50 last:border-0"
            >
              <div>
                <div className="text-sm font-medium">{ex.name}</div>
                <div className="text-xs text-zinc-500">{ex.equipment}</div>
              </div>
              <Plus size={16} className="text-zinc-500" />
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-zinc-600">No exercises found</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── finish modal ───────────────────────────────────────────────────────────

function FinishModal({ onConfirm, onDiscard, onCancel }: {
  onConfirm: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
        <h2 className="text-lg font-bold mb-1">Finish Workout?</h2>
        <p className="text-sm text-zinc-400 mb-6">Your sets will be saved and PRs updated.</p>
        <div className="flex flex-col gap-2">
          <button onClick={onConfirm} className="w-full rounded-xl bg-orange-500 py-3 font-bold text-white active:opacity-80">
            Save Workout
          </button>
          <button onClick={onDiscard} className="w-full rounded-xl bg-zinc-800 py-3 font-medium text-red-400 active:opacity-80">
            Discard
          </button>
          <button onClick={onCancel} className="w-full rounded-xl py-2.5 text-zinc-400 active:opacity-80">
            Keep Going
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── inner page (reads search params) ─────────────────────────────────────

function WorkoutPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const templateId = params.get("template");

  const [exercises, setExercises] = useState<ActiveExercise[]>(() => {
    if (templateId) {
      const tpl = WORKOUT_TEMPLATES.find((t) => t.id === templateId);
      if (tpl) {
        return tpl.exerciseIds.map((id) => {
          const ex = EXERCISES.find((e) => e.id === id)!;
          return { instanceId: crypto.randomUUID(), exercise: ex, sets: [newSet(), newSet(), newSet()] };
        });
      }
    }
    return [];
  });

  const [name, setName] = useState(() => {
    if (templateId) {
      const tpl = WORKOUT_TEMPLATES.find((t) => t.id === templateId);
      return tpl ? tpl.name : "My Workout";
    }
    return "My Workout";
  });

  const [editingName, setEditingName] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const startedAt = useRef(Date.now());
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (editingName) nameRef.current?.focus();
  }, [editingName]);

  const updateSet = useCallback((instId: string, setId: string, patch: Partial<WorkoutSet>) => {
    setExercises((prev) =>
      prev.map((ae) =>
        ae.instanceId !== instId
          ? ae
          : { ...ae, sets: ae.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }
      )
    );
  }, []);

  const addSet = useCallback((instId: string) => {
    setExercises((prev) =>
      prev.map((ae) =>
        ae.instanceId !== instId ? ae : { ...ae, sets: [...ae.sets, newSet()] }
      )
    );
  }, []);

  const removeExercise = useCallback((instId: string) => {
    setExercises((prev) => prev.filter((ae) => ae.instanceId !== instId));
  }, []);

  function handleFinish() {
    const workout: CompletedWorkout = {
      id: crypto.randomUUID(),
      name,
      date: startedAt.current,
      exercises,
      duration: seconds * 1000,
    };
    saveCompletedWorkout(workout);
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="mx-auto max-w-md flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="text-zinc-400 active:text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 flex items-center gap-1.5">
            {editingName ? (
              <input
                ref={nameRef}
                className="w-full bg-transparent font-bold text-sm text-white focus:outline-none border-b border-orange-500 pb-0.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="font-bold text-sm truncate text-left"
              >
                {name}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-400 shrink-0">
            <Timer size={13} />
            {fmtTime(seconds)}
          </div>
          <button
            onClick={() => setShowFinish(true)}
            className="shrink-0 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-bold text-white active:opacity-80"
          >
            Finish
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pt-4 space-y-3">
        {exercises.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-800 py-14 text-center text-zinc-600">
            <p className="text-sm">No exercises added yet.</p>
          </div>
        )}

        {exercises.map((ae) => (
          <ExerciseCard
            key={ae.instanceId}
            ae={ae}
            onAddSet={() => addSet(ae.instanceId)}
            onUpdateSet={(setId, patch) => updateSet(ae.instanceId, setId, patch)}
            onRemove={() => removeExercise(ae.instanceId)}
          />
        ))}

        <button
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 py-4 text-sm font-medium text-zinc-400 active:bg-zinc-800/50"
        >
          <Plus size={16} /> Add Exercise
        </button>
      </div>

      <ExerciseSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onPick={(ae) => { setExercises((prev) => [...prev, ae]); setSheetOpen(false); }}
      />

      {showFinish && (
        <FinishModal
          onConfirm={handleFinish}
          onDiscard={() => router.push("/")}
          onCancel={() => setShowFinish(false)}
        />
      )}
    </main>
  );
}

// ─── exported page (Suspense wrapper for useSearchParams) ──────────────────

export default function WorkoutPage() {
  return (
    <Suspense>
      <WorkoutPageInner />
    </Suspense>
  );
}
