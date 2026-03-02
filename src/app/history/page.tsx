"use client";

import Link from "next/link";
import { loadHistory, loadSettings, lbToKg } from "@/lib/storage";
import { useMemo, useState } from "react";

export default function HistoryPage() {
  const [history] = useState(loadHistory());
  const [settings] = useState(loadSettings());
  const sessions = useMemo(() => history, [history]);

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

  const innerCardCls = isWhite
    ? "bg-gray-50 border border-gray-100 rounded-xl"
    : isNone
    ? "bg-foreground/[0.02] border border-foreground/8 rounded-xl"
    : "bg-white/[0.04] border border-white/5 rounded-xl";

  return (
    <div className={`min-h-screen ${rootBg} ${isDarkTheme ? "text-white" : ""}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 ${headerCls}`}>
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <h1 className={`font-black text-lg tracking-tight ${fgCls}`}>History</h1>
          <Link href="/" className={navPillCls}>
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 pb-16">
        {sessions.length === 0 ? (
          <div className={`rounded-2xl p-8 text-center ${cardCls}`}>
            <div className={`text-4xl mb-3 ${mutedCls}`}>—</div>
            <p className={`font-semibold mb-1 ${fgCls}`}>No sessions yet</p>
            <p className={`text-sm ${mutedCls}`}>Complete a workout to see it here.</p>
            <Link href="/" className={`inline-block mt-4 text-sm px-4 py-2 rounded-full transition ${
              isWhite ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-indigo-600 text-white hover:bg-indigo-500"
            }`}>
              Start a workout
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className={`${sectionHeadCls} mb-4`}>{sessions.length} session{sessions.length !== 1 ? "s" : ""}</p>

            {sessions.map((s) => {
              const date = new Date(s.date);
              const totalSets = s.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
              const totalVol = s.exercises.reduce((sum, ex) =>
                sum + ex.sets.reduce((sv, st) =>
                  sv + st.reps * (s.unitAtTime === "kg" ? lbToKg(st.weightLb) : st.weightLb), 0), 0);

              return (
                <div key={s.id} className={`rounded-2xl overflow-hidden ${cardCls}`}>
                  {/* Session header */}
                  <div className={`px-4 pt-4 pb-3 border-b ${isWhite ? "border-gray-100" : "border-white/8"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={`font-bold text-sm ${fgCls}`}>
                          {date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                        </div>
                        <div className={`text-xs mt-0.5 ${mutedCls}`}>
                          {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          {" · "}Rest {s.restSeconds}s{" · "}{s.unitAtTime}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`text-center px-2 py-1 rounded-lg ${
                          isWhite ? "bg-indigo-50 text-indigo-600" : "bg-indigo-500/15 text-indigo-400"
                        }`}>
                          <div className="text-lg font-black leading-none">{totalSets}</div>
                          <div className={`text-[9px] uppercase tracking-wider ${isWhite ? "text-indigo-400" : "text-indigo-500"}`}>sets</div>
                        </div>
                        {totalVol > 0 && (
                          <div className={`text-center px-2 py-1 rounded-lg ${
                            isWhite ? "bg-emerald-50 text-emerald-700" : "bg-emerald-500/15 text-emerald-400"
                          }`}>
                            <div className="text-lg font-black leading-none">{Math.round(totalVol).toLocaleString()}</div>
                            <div className={`text-[9px] uppercase tracking-wider ${isWhite ? "text-emerald-500" : "text-emerald-600"}`}>
                              {s.unitAtTime} vol
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Exercises */}
                  <div className="px-4 py-3 space-y-3">
                    {s.exercises.map((ex) => (
                      <div key={ex.exerciseId} className={`p-3 ${innerCardCls}`}>
                        <div className={`font-semibold text-xs mb-2 ${fgCls}`}>{ex.name}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {ex.sets.map((st, i) => (
                            <span
                              key={i}
                              className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                                isWhite
                                  ? "bg-gray-100 text-gray-600 border border-gray-200"
                                  : "bg-white/8 text-white/60 border border-white/8"
                              }`}
                            >
                              {st.reps}r
                              {st.weightLb > 0
                                ? ` × ${s.unitAtTime === "kg" ? lbToKg(st.weightLb) : st.weightLb}${s.unitAtTime}`
                                : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
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
