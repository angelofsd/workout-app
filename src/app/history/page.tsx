"use client";

import Link from "next/link";
import { loadHistory, loadSettings, lbToKg } from "@/lib/storage";
import { useMemo, useState } from "react";

export default function HistoryPage() {
  const [history] = useState(loadHistory());
  const [settings] = useState(loadSettings());
  const sessions = useMemo(() => history, [history]);

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">History</h1>
        <Link href="/" className="underline-offset-4 hover:underline">Back</Link>
      </div>
      <div className="grid gap-4">
        {sessions.length === 0 && <div>No sessions yet. Complete a workout to see it here.</div>}
        {sessions.map((s) => (
          <div key={s.id} className="border rounded p-4">
            <div className="font-semibold mb-2">{new Date(s.date).toLocaleString()}</div>
            <div className="text-sm opacity-80 mb-2">Rest: {s.restSeconds}s • Unit: {s.unitAtTime}</div>
            <div className="grid gap-2">
              {s.exercises.map((ex) => (
                <div key={ex.exerciseId} className="border rounded p-3">
                  <div className="font-medium mb-1">{ex.name}</div>
                  <ul className="text-sm grid gap-1">
                    {ex.sets.map((st, i) => (
                      <li key={i}>
                        Set {i + 1}: {st.reps} reps @ {settings.unit === "kg" ? lbToKg(st.weightLb) : st.weightLb} {settings.unit}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
