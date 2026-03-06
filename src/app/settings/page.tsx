"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Settings, User, Scale } from "lucide-react";
import { loadSettings, saveSettings } from "@/lib/storage";
import type { Settings as AppSettings } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>({ unit: "lb", username: "Athlete" });
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setNameInput(s.username);
  }, []);

  const update = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  const saveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) update({ username: trimmed });
    setEditingName(false);
  };

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
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700">
            <Settings size={20} className="text-zinc-400" />
          </div>
          <h1 className="text-white" style={{ fontWeight: 800, fontSize: "1.5rem" }}>Settings</h1>
        </div>
      </div>

      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        {/* Profile Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-500/25">
            <span className="text-white capitalize" style={{ fontWeight: 800, fontSize: "1.4rem" }}>
              {settings.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                className="text-white bg-transparent border-b border-orange-500 outline-none w-full"
                style={{ fontWeight: 700, fontSize: "0.95rem" }}
              />
            ) : (
              <p className="text-white" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                {settings.username}
              </p>
            )}
            <p className="text-zinc-500" style={{ fontSize: "0.78rem" }}>FORGE athlete</p>
          </div>
          <button
            onClick={() => setEditingName(true)}
            className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <User size={15} />
          </button>
        </div>

        {/* Preferences */}
        <p className="text-zinc-500 mb-3 uppercase tracking-wider" style={{ fontSize: "0.72rem", fontWeight: 600 }}>Preferences</p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-5">
          {/* Weight unit */}
          <div className="px-4 py-4 flex items-center gap-3 border-b border-zinc-800">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Scale size={15} className="text-zinc-400" />
            </div>
            <span className="flex-1 text-white" style={{ fontWeight: 600, fontSize: "0.9rem" }}>Weight Unit</span>
            <div className="flex bg-zinc-800 rounded-lg p-0.5">
              {(["lb", "kg"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => update({ unit: u })}
                  className={`px-4 py-1.5 rounded-md transition-all ${settings.unit === u ? "bg-orange-500 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
                  style={{ fontWeight: 600, fontSize: "0.82rem" }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* About */}
        <p className="text-zinc-500 mb-3 uppercase tracking-wider" style={{ fontSize: "0.72rem", fontWeight: 600 }}>About</p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center flex-shrink-0">
              <span className="text-orange-400" style={{ fontWeight: 800, fontSize: "0.75rem" }}>F</span>
            </div>
            <div className="flex-1">
              <p className="text-white" style={{ fontWeight: 600, fontSize: "0.9rem" }}>FORGE</p>
              <p className="text-zinc-500" style={{ fontSize: "0.75rem" }}>Build. Track. Conquer.</p>
            </div>
            <span className="text-zinc-600" style={{ fontSize: "0.75rem" }}>v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
