"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trophy, Medal, Crown } from "lucide-react";
import { loadPRs, loadSettings, lbToKg } from "@/lib/storage";
import type { AllPRs } from "@/lib/types";

const MEDAL_COLORS = [
  "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  "text-zinc-300 bg-zinc-300/10 border-zinc-300/20",
  "text-amber-600 bg-amber-600/10 border-amber-600/20",
];

interface FlatPR {
  exerciseId: string;
  exerciseName: string;
  reps: number;
  weightLb: number;
  date: number;
}

function flattenPRs(allPRs: AllPRs): FlatPR[] {
  const result: FlatPR[] = [];
  for (const ep of Object.values(allPRs)) {
    for (const rp of Object.values(ep.byReps)) {
      result.push({
        exerciseId: ep.exerciseId,
        exerciseName: ep.exerciseName,
        reps: rp.reps,
        weightLb: rp.weightLb,
        date: rp.date,
      });
    }
  }
  return result;
}

export default function PRsPage() {
  const router = useRouter();
  const [allPRs, setAllPRs] = useState<AllPRs>({});
  const [unit, setUnit] = useState<"lb" | "kg">("lb");
  const [sortBy, setSortBy] = useState<"date" | "exercise">("date");

  useEffect(() => {
    setAllPRs(loadPRs());
    setUnit(loadSettings().unit);
  }, []);

  const flat = flattenPRs(allPRs);
  const sorted = [...flat].sort((a, b) =>
    sortBy === "date" ? b.date - a.date : a.exerciseName.localeCompare(b.exerciseName)
  );

  const displayWeight = (lb: number) =>
    unit === "kg" ? `${lbToKg(lb)} kg` : `${lb} lb`;

  const top3 = sorted.slice(0, 3);

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
          <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center border border-yellow-500/20">
            <Trophy size={20} className="text-yellow-400" />
          </div>
          <h1 className="text-white" style={{ fontWeight: 800, fontSize: "1.5rem" }}>Personal Records</h1>
        </div>
        <p className="text-zinc-500" style={{ fontSize: "0.85rem" }}>Your best lifts ever</p>
      </div>

      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800">
              <Trophy size={28} className="text-zinc-600" />
            </div>
            <p className="text-zinc-400" style={{ fontWeight: 600 }}>No PRs yet</p>
            <p className="text-zinc-600 mt-1" style={{ fontSize: "0.85rem" }}>Log a workout to start tracking records.</p>
          </div>
        ) : (
          <>
            {top3.length > 0 && (
              <div className="mb-6">
                <p className="text-zinc-500 mb-3 uppercase tracking-wider" style={{ fontSize: "0.72rem", fontWeight: 600 }}>Top Lifts</p>
                <div className="grid grid-cols-3 gap-2">
                  {top3.map((pr, idx) => (
                    <div key={`${pr.exerciseId}-${pr.reps}`}
                      className={`bg-zinc-900 rounded-2xl p-3.5 border flex flex-col items-center text-center ${MEDAL_COLORS[idx]}`}
                    >
                      {idx === 0 ? <Crown size={18} className="text-yellow-400 mb-2" />
                        : <Medal size={18} className={idx === 1 ? "text-zinc-300 mb-2" : "text-amber-600 mb-2"} />}
                      <p className="text-white truncate w-full" style={{ fontWeight: 700, fontSize: "0.78rem" }}>{pr.exerciseName}</p>
                      <p className="text-white mt-1" style={{ fontWeight: 800, fontSize: "1.05rem" }}>{displayWeight(pr.weightLb)}</p>
                      <p className="text-zinc-500" style={{ fontSize: "0.68rem" }}>x {pr.reps} rep{pr.reps !== 1 ? "s" : ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              <p className="text-zinc-500 uppercase tracking-wider flex-1" style={{ fontSize: "0.72rem", fontWeight: 600 }}>All Records</p>
              <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                {(["date", "exercise"] as const).map((opt) => (
                  <button key={opt} onClick={() => setSortBy(opt)}
                    className={`px-3 py-1 rounded-md transition-all capitalize ${sortBy === opt ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                    style={{ fontSize: "0.75rem", fontWeight: 600 }}
                  >{opt}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {sorted.map((pr) => (
                <div key={`${pr.exerciseId}-${pr.reps}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-white truncate" style={{ fontWeight: 600, fontSize: "0.9rem" }}>{pr.exerciseName}</p>
                    <p className="text-zinc-500" style={{ fontSize: "0.72rem" }}>
                      {pr.reps} rep{pr.reps !== 1 ? "s" : ""} - {new Date(pr.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <p className="text-orange-400 flex-shrink-0 ml-3" style={{ fontWeight: 700, fontSize: "1rem" }}>{displayWeight(pr.weightLb)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
