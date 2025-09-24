"use client";

import Link from "next/link";
import { loadPRs, loadSettings, lbToKg } from "@/lib/storage";
import { useMemo, useState } from "react";

export default function PRsPage() {
  const [prs] = useState(loadPRs());
  const [settings] = useState(loadSettings());
  const entries = useMemo(() => Object.values(prs), [prs]);

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Personal Records</h1>
        <Link href="/" className="underline-offset-4 hover:underline">Back</Link>
      </div>
      <div className="grid gap-4">
        {entries.length === 0 && <div>No PRs yet. Log a workout to set PRs.</div>}
        {entries.map((e) => {
          const rows = Array.from({ length: 15 }, (_, i) => i + 1).map((r) => {
            const p = e.byReps[r];
            if (!p) return { reps: r, value: "-" };
            const v = settings.unit === "kg" ? lbToKg(p.weightLb) : p.weightLb;
            return { reps: r, value: `${v} ${settings.unit}` };
          });
          return (
            <div key={e.exerciseId} className="border rounded p-4">
              <div className="font-semibold mb-2">{e.exerciseId}</div>
              <div className="text-sm grid grid-cols-3 sm:grid-cols-5 gap-1">
                {rows.map((r) => (
                  <div key={r.reps} className="border rounded px-2 py-1">
                    {r.reps}r: {r.value}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
