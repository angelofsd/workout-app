"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] p-6 grid place-items-center">
      <div className="max-w-2xl w-full border rounded p-4 bg-black/5 dark:bg-white/10">
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="mb-2 text-sm opacity-80">{error.message}</p>
        {error.stack && (
          <pre className="whitespace-pre-wrap text-xs opacity-70 overflow-auto max-h-64">
            {error.stack}
          </pre>
        )}
        <div className="mt-4 flex gap-2">
          <button className="bg-foreground text-background rounded px-3 py-1" onClick={() => reset()}>
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
