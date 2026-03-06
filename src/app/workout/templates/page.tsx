"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { WORKOUT_TEMPLATES, EXERCISES } from "@/lib/exercises";

export default function TemplatesPage() {
  const router = useRouter();

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
        <h1 className="text-white" style={{ fontWeight: 800, fontSize: "1.6rem" }}>Templates</h1>
        <p className="text-zinc-500 mt-1" style={{ fontSize: "0.85rem" }}>Choose a preset to begin</p>
      </div>

      <div className="flex-1 px-5 pb-8">
        <p className="text-zinc-500 mb-3 uppercase tracking-wider" style={{ fontSize: "0.72rem", fontWeight: 600 }}>Presets</p>
        <div className="space-y-3">
          {WORKOUT_TEMPLATES.map((template) => {
            const previewExercises = template.exerciseIds.slice(0, 3)
              .map((id) => EXERCISES.find((e) => e.id === id)?.name)
              .filter(Boolean);
            return (
              <button
                key={template.id}
                onClick={() => router.push(`/workout?template=${template.id}`)}
                className={`w-full bg-gradient-to-r ${template.color} bg-zinc-900 rounded-2xl p-5 flex items-center gap-4 border border-zinc-800 hover:border-zinc-600 active:opacity-80 transition-all text-left group`}
              >
                <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center flex-shrink-0">
                  <span style={{ fontSize: "1.75rem" }}>{template.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white" style={{ fontWeight: 700, fontSize: "1rem" }}>{template.name}</p>
                  <p className="text-zinc-500 mt-0.5" style={{ fontSize: "0.78rem" }}>{template.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {previewExercises.map((name) => (
                      <span key={name} className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md" style={{ fontSize: "0.68rem" }}>{name}</span>
                    ))}
                    {template.exerciseIds.length > 3 && (
                      <span className="bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-md" style={{ fontSize: "0.68rem" }}>+{template.exerciseIds.length - 3} more</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <p className="text-zinc-500 mb-3 uppercase tracking-wider" style={{ fontSize: "0.72rem", fontWeight: 600 }}>Custom</p>
          <button
            onClick={() => router.push("/workout")}
            className="w-full bg-zinc-900 border border-dashed border-zinc-700 hover:border-orange-500/50 hover:bg-zinc-800 rounded-2xl p-5 flex items-center gap-4 transition-all text-left group"
          >
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
              <Dumbbell size={24} className="text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-white" style={{ fontWeight: 700 }}>Start from Scratch</p>
              <p className="text-zinc-500 mt-0.5" style={{ fontSize: "0.78rem" }}>Build your own exercise list</p>
            </div>
            <ChevronRight size={18} className="text-zinc-600 group-hover:text-orange-400 transition-colors flex-shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
