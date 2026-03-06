"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronDown, Dumbbell, Clock, BarChart2, History } from "lucide-react";
import { loadHistory, loadSettings } from "@/lib/storage";
import type { CompletedWorkout } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/exercises";

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function calcVolume(workout: CompletedWorkout) {
  return workout.exercises.reduce((total, ex) => {
    return total + ex.sets.reduce((st, s) => st + (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0), 0);
  }, 0);
}

function WorkoutCard({ workout, unit }: { workout: CompletedWorkout; unit: string }) {
  const [expanded, setExpanded] = useState(false);
  const volume = calcVolume(workout);
  const totalSets = workout.exercises.reduce((t, ex) => t + ex.sets.length, 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-4 flex items-center gap-3 text-left"
      >
        <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <Dumbbell size={18} className="text-zinc-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white" style={{ fontWeight: 700, fontSize: "0.95rem" }}>{workout.name}</p>
          <p className="text-zinc-500" style={{ fontSize: "0.75rem" }}>
            {new Date(workout.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-zinc-300" style={{ fontWeight: 600, fontSize: "0.85rem" }}>{formatDuration(workout.duration)}</p>
            <p className="text-zinc-600" style={{ fontSize: "0.7rem" }}>{totalSets} sets</p>
          </div>
          <ChevronDown size={16} className={`text-zinc-600 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800">
          <div className="px-4 py-3 flex gap-4 border-b border-zinc-800">
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-zinc-500" />
              <span className="text-zinc-400" style={{ fontSize: "0.78rem" }}>{formatDuration(workout.duration)}</span>
            </div>
            {volume > 0 && (
              <div className="flex items-center gap-1.5">
                <BarChart2 size={13} className="text-zinc-500" />
                <span className="text-zinc-400" style={{ fontSize: "0.78rem" }}>
                  {unit === "kg"
                    ? `${Math.round(volume * 0.453592).toLocaleString()} kg`
                    : `${volume.toLocaleString()} lb`} vol
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Dumbbell size={13} className="text-zinc-500" />
              <span className="text-zinc-400" style={{ fontSize: "0.78rem" }}>{workout.exercises.length} exercises</span>
            </div>
          </div>

          <div className="px-4 py-3 space-y-3">
            {workout.exercises.map((ae) => {
              const catColor = CATEGORY_COLORS[ae.exercise.category] ?? "text-zinc-400";
              const catTextColor = catColor.split(" ")[0];
              return (
                <div key={ae.instanceId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-white" style={{ fontWeight: 600, fontSize: "0.85rem" }}>{ae.exercise.name}</p>
                    <span className={catTextColor} style={{ fontSize: "0.72rem" }}>{ae.exercise.category}</span>
                  </div>
                  <div className="space-y-1">
                    {ae.sets.map((s, idx) => (
                      <div key={s.id} className="flex items-center gap-2">
                        <span className="text-zinc-600 w-8" style={{ fontSize: "0.72rem" }}>Set {idx + 1}</span>
                        <div className="flex-1 bg-zinc-800 rounded-lg px-3 py-1.5 flex items-center justify-between">
                          <span className="text-zinc-300" style={{ fontSize: "0.8rem" }}>
                            {s.weight ? `${s.weight} ${unit}` : "—"}
                          </span>
                          <span className="text-zinc-500" style={{ fontSize: "0.8rem" }}>
                            {s.reps ? `${s.reps} reps` : "—"}
                          </span>
                        </div>
                        {s.completed && (
                          <span className="text-green-500 text-xs">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<CompletedWorkout[]>([]);
  const [unit, setUnit] = useState<"lb" | "kg">("lb");

  useEffect(() => {
    setHistory(loadHistory());
    setUnit(loadSettings().unit);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <div className="px-5 pt-12 pb-4">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors mb-5"
          style={{ fontSize: "0.9rem" }}
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center border border-blue-500/20">
            <History size={20} className="text-blue-400" />
          </div>
          <h1 className="text-white" style={{ fontWeight: 800, fontSize: "1.5rem" }}>History</h1>
        </div>
        <p className="text-zinc-500" style={{ fontSize: "0.85rem" }}>All your past workouts</p>
      </div>

      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800">
              <History size={28} className="text-zinc-600" />
            </div>
            <p className="text-zinc-400" style={{ fontWeight: 600 }}>No sessions yet</p>
            <p className="text-zinc-600 mt-1" style={{ fontSize: "0.85rem" }}>Complete a workout to see it here.</p>
          </div>
        ) : (
          <>
            <p className="text-zinc-500 mb-3 uppercase tracking-wider" style={{ fontSize: "0.72rem", fontWeight: 600 }}>
              {history.length} session{history.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-3">
              {history.map((w) => (
                <WorkoutCard key={w.id} workout={w} unit={unit} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
