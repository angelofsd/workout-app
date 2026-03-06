"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dumbbell, ChevronRight, Clock, Flame, Trophy } from "lucide-react";
import { loadHistory, loadSettings } from "@/lib/storage";
import type { CompletedWorkout, Settings } from "@/lib/types";

function formatDuration(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function formatDate(epoch: number) {
  return new Date(epoch).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function totalSets(w: CompletedWorkout) {
  return w.exercises.reduce((a, ae) => a + ae.sets.filter((s) => s.completed).length, 0);
}

export default function HomePage() {
  const [history, setHistory] = useState<CompletedWorkout[]>([]);
  const [settings, setSettings] = useState<Settings>({ unit: "lb", username: "Athlete" });

  useEffect(() => {
    setHistory(loadHistory());
    setSettings(loadSettings());
  }, []);

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const weeklyCount = history.filter((w) => w.date >= weekAgo).length;
  const recent = history.slice(0, 3);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-md px-4 pb-24 pt-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="text-orange-500" size={22} />
            <span className="text-xs font-bold tracking-widest text-orange-500 uppercase">
              Forge
            </span>
          </div>
          <h1 className="text-3xl font-extrabold">
            Hey, {settings.username}
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">Ready to build something?</p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-center">
            <Flame className="text-orange-500 mx-auto mb-1" size={18} />
            <div className="text-2xl font-bold">{weeklyCount}</div>
            <div className="text-xs text-zinc-500 mt-0.5">This week</div>
          </div>
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-center">
            <Trophy className="text-orange-500 mx-auto mb-1" size={18} />
            <div className="text-2xl font-bold">{history.length}</div>
            <div className="text-xs text-zinc-500 mt-0.5">Total sessions</div>
          </div>
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-center">
            <Clock className="text-orange-500 mx-auto mb-1" size={18} />
            <div className="text-2xl font-bold">
              {history.length > 0 ? formatDuration(history[0].duration) : "—"}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">Last workout</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 mb-10">
          <Link
            href="/workout/templates"
            className="flex items-center justify-between rounded-2xl bg-orange-500 px-5 py-4 font-bold text-white active:opacity-80 transition-opacity"
          >
            <span>Choose a Template</span>
            <ChevronRight size={20} />
          </Link>
          <Link
            href="/workout"
            className="flex items-center justify-between rounded-2xl bg-zinc-800 border border-zinc-700 px-5 py-4 font-semibold text-zinc-100 active:opacity-80 transition-opacity"
          >
            <span>Start Blank Workout</span>
            <ChevronRight size={20} />
          </Link>
        </div>

        {/* Recent sessions */}
        {recent.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                Recent
              </h2>
              <Link href="/history" className="text-xs text-orange-500 font-medium">
                See all
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {recent.map((w) => (
                <div
                  key={w.id}
                  className="rounded-2xl bg-zinc-900 border border-zinc-800 px-5 py-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{w.name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{formatDate(w.date)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-orange-400">
                        {formatDuration(w.duration)}
                      </div>
                      <div className="text-xs text-zinc-500">{totalSets(w)} sets</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {w.exercises.slice(0, 4).map((ae) => (
                      <span
                        key={ae.instanceId}
                        className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300"
                      >
                        {ae.exercise.name}
                      </span>
                    ))}
                    {w.exercises.length > 4 && (
                      <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-500">
                        +{w.exercises.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {recent.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-800 px-5 py-10 text-center text-zinc-600">
            <Dumbbell className="mx-auto mb-3 text-zinc-700" size={32} />
            <p className="text-sm">No workouts yet. Start your first session!</p>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto max-w-md flex justify-around py-3">
          <Link href="/" className="flex flex-col items-center gap-0.5 text-orange-500 text-xs font-medium">
            <Dumbbell size={20} />
            Home
          </Link>
          <Link href="/history" className="flex flex-col items-center gap-0.5 text-zinc-500 text-xs">
            <Clock size={20} />
            History
          </Link>
          <Link href="/prs" className="flex flex-col items-center gap-0.5 text-zinc-500 text-xs">
            <Trophy size={20} />
            PRs
          </Link>
          <Link href="/settings" className="flex flex-col items-center gap-0.5 text-zinc-500 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
            Settings
          </Link>
        </div>
      </nav>
    </main>
  );
}
