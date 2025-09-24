"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [running, setRunning] = useState<boolean>(false);
  const intervalRef = useRef<number | null>(null);

  const clearTick = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearTick();
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [running]);

  const pause = useCallback(() => {
    clearTick();
    setRunning(false);
  }, []);

  const reset = useCallback((newSeconds: number) => {
    clearTick();
    setSecondsLeft(newSeconds);
    setRunning(false);
  }, []);

  useEffect(() => () => clearTick(), []);

  return { secondsLeft, running, start, pause, reset };
}
