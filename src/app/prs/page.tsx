"use client";

import Link from "next/link";
import { loadPRs, loadSettings, lbToKg } from "@/lib/storage";
import { useMemo, useState } from "react";

export default function PRsPage() {
  const [prs] = useState(loadPRs());
  const [settings] = useState(loadSettings());
  const entries = useMemo(() => Object.values(prs), [prs]);

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
      : "bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900";

  const cardCls = isWhite
    ? "bg-white border border-gray-200 shadow-sm"
    : isNone
    ? "bg-foreground/[0.04] border border-foreground/10"
    : "bg-white/[0.07] border border-white/10 backdrop-blur-sm";

  const mutedCls = isWhite ? "text-gray-500" : isNone ? "text-foreground/50" : "text-white/50";
  const fgCls = isWhite ? "text-gray-900" : isNone ? "text-foreground" : "text-white";
  const sectionHeadCls = isWhite
    ? "text-gray-400 uppercase text-[10px] font-bold tracking-widest"
    : isNone
    ? "text-foreground/40 uppercase text-[10px] font-bold tracking-widest"
    : "text-white/40 uppercase text-[10px] font-bold tracking-widest";

  const headerCls = isWhite
    ? "border-b border-gray-200 bg-white/90 backdrop-blur-md"
    : isNone
    ? "border-b border-foreground/10 bg-background/80 backdrop-blur-md"
    : "border-b border-white/10 bg-black/20 backdrop-blur-md";

  const navPillCls = isWhite
    ? "text-sm px-3 py-1 rounded-full border border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
    : isNone
    ? "text-sm px-3 py-1 rounded-full border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 transition"
    : "text-sm px-3 py-1 rounded-full border border-white/15 bg-white/8 hover:bg-white/15 text-white transition";

  return (
    <div className={`min-h-screen ${rootBg} ${isDarkTheme ? "text-white" : ""}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 ${headerCls}`}>
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <h1 className={`font-black text-lg tracking-tight ${fgCls}`}>Personal Records</h1>
          <Link href="/" className={navPillCls}>
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 pb-16">
        {entries.length === 0 ? (
          <div className={`rounded-2xl p-8 text-center ${cardCls}`}>
            <div className={`text-4xl mb-3 ${mutedCls}`}>—</div>
            <p className={`font-semibold mb-1 ${fgCls}`}>No PRs yet</p>
            <p className={`text-sm ${mutedCls}`}>Log a workout to start tracking personal records.</p>
            <Link href="/" className={`inline-block mt-4 text-sm px-4 py-2 rounded-full transition ${
              isWhite ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-indigo-600 text-white hover:bg-indigo-500"
            }`}>
              Start a workout
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className={`${sectionHeadCls} mb-4`}>{entries.length} exercise{entries.length !== 1 ? "s" : ""} tracked</p>

            {entries.map((e) => {
              // Find the overall best (1RM equivalent highlight)
              const bestEntry = Object.values(e.byReps).reduce<{ reps: number; weightLb: number; date: number } | null>(
                (best, pr) => {
                  if (!best || pr.weightLb > best.weightLb) return pr;
                  return best;
                },
                null
              );

              const rows = Array.from({ length: 15 }, (_, i) => i + 1).map((r) => {
                const p = e.byReps[r];
                if (!p) return { reps: r, value: null, date: null };
                const v = settings.unit === "kg" ? lbToKg(p.weightLb) : p.weightLb;
                return { reps: r, value: `${v} ${settings.unit}`, date: p.date };
              });

              const filledRows = rows.filter((r) => r.value !== null);

              return (
                <div key={e.exerciseId} className={`rounded-2xl overflow-hidden ${cardCls}`}>
                  {/* Exercise header */}
                  <div className={`px-4 pt-4 pb-3 border-b ${isWhite ? "border-gray-100" : "border-white/8"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={`font-bold ${fgCls}`}>{e.exerciseId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</div>
                        <div className={`text-xs mt-0.5 ${mutedCls}`}>{filledRows.length} rep range{filledRows.length !== 1 ? "s" : ""} logged</div>
                      </div>
                      {bestEntry && (
                        <div className={`shrink-0 text-right px-3 py-2 rounded-xl ${
                          isWhite ? "bg-amber-50 border border-amber-200" : "bg-amber-500/15 border border-amber-500/25"
                        }`}>
                          <div className={`text-lg font-black leading-none ${isWhite ? "text-amber-600" : "text-amber-400"}`}>
                            {settings.unit === "kg" ? lbToKg(bestEntry.weightLb) : bestEntry.weightLb}
                            <span className={`text-xs font-medium ml-0.5 ${isWhite ? "text-amber-500" : "text-amber-500"}`}>{settings.unit}</span>
                          </div>
                          <div className={`text-[9px] uppercase tracking-wider mt-0.5 ${isWhite ? "text-amber-500" : "text-amber-600"}`}>
                            best @ {bestEntry.reps}r
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rep range grid */}
                  <div className="px-4 py-3">
                    <p className={`${sectionHeadCls} mb-2.5`}>By rep range</p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {rows.map((r) => (
                        <div
                          key={r.reps}
                          className={`rounded-xl px-2 py-2 text-center transition-all ${
                            r.value
                              ? isWhite
                                ? "bg-indigo-50 border border-indigo-200"
                                : "bg-indigo-500/15 border border-indigo-500/20"
                              : isWhite
                              ? "bg-gray-50 border border-gray-100 opacity-40"
                              : "bg-white/[0.03] border border-white/5 opacity-30"
                          }`}
                        >
                          <div className={`text-[10px] font-semibold mb-0.5 ${
                            r.value
                              ? isWhite ? "text-indigo-500" : "text-indigo-400"
                              : mutedCls
                          }`}>
                            {r.reps}r
                          </div>
                          <div className={`text-xs font-bold leading-tight ${r.value ? fgCls : mutedCls}`}>
                            {r.value
                              ? r.value.replace(` ${settings.unit}`, "")
                              : "–"}
                          </div>
                          {r.value && (
                            <div className={`text-[9px] ${mutedCls}`}>{settings.unit}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
