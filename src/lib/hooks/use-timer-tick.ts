"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTimerStore } from "@/lib/stores/timer-store";

/** Hydrate the persisted store on mount (SSR-safe). */
export function useHydrateStore() {
  useEffect(() => {
    useTimerStore.persist.rehydrate();
  }, []);

  return useSyncExternalStore(
    (cb) => useTimerStore.persist.onFinishHydration(cb),
    () => useTimerStore.persist.hasHydrated(),
    () => false,
  );
}

/** Drive the timer's elapsed-seconds counter via setInterval. */
export function useTimerTick() {
  const isRunning = useTimerStore((s) => s.timer.isRunning);
  const isPaused = useTimerStore((s) => s.timer.isPaused);

  useEffect(() => {
    if (!isRunning || isPaused) return;

    // Tick immediately, then every second
    useTimerStore.getState().timerTick();
    const id = setInterval(() => {
      useTimerStore.getState().timerTick();
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning, isPaused]);

  // Re-calc on tab visibility
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        const s = useTimerStore.getState();
        if (s.timer.isRunning && !s.timer.isPaused) {
          s.timerTick();
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);
}

/** Drive the countdown's elapsed-seconds counter via setInterval. */
export function useCountdownTick() {
  const isRunning = useTimerStore((s) => s.countdown.isRunning);
  const isPaused = useTimerStore((s) => s.countdown.isPaused);
  const isComplete = useTimerStore((s) => s.countdown.isComplete);

  useEffect(() => {
    if (!isRunning || isPaused || isComplete) return;

    useTimerStore.getState().countdownTick();
    const id = setInterval(() => {
      useTimerStore.getState().countdownTick();
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning, isPaused, isComplete]);

  // Re-calc on tab visibility
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        const s = useTimerStore.getState();
        if (s.countdown.isRunning && !s.countdown.isPaused) {
          s.countdownTick();
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);
}
