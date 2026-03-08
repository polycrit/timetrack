"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { playCountdownComplete } from "@/lib/sounds";
import { formatDuration } from "@/lib/utils";

interface CountdownState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pausedDuration: number;
  pauseStart: number | null;
  targetSeconds: number;
  isComplete: boolean;
  projectId: string | null;
  description: string;
}

const STORAGE_KEY = "timetrack-countdown";

const DEFAULT_STATE: CountdownState = {
  isRunning: false,
  isPaused: false,
  startTime: null,
  pausedDuration: 0,
  pauseStart: null,
  targetSeconds: 25 * 60,
  isComplete: false,
  projectId: null,
  description: "",
};

function loadState(): CountdownState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_STATE, ...JSON.parse(stored) };
  } catch {
    // ignore
  }
  return DEFAULT_STATE;
}

function saveState(state: CountdownState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function sendNotification(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

export function useCountdown() {
  const [state, setState] = useState<CountdownState>(DEFAULT_STATE);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
  }, []);

  // Calculate elapsed seconds
  const calcElapsed = useCallback(() => {
    if (!state.startTime) return 0;
    const now = state.isPaused && state.pauseStart ? state.pauseStart : Date.now();
    return Math.floor((now - state.startTime - state.pausedDuration) / 1000);
  }, [state.startTime, state.isPaused, state.pauseStart, state.pausedDuration]);

  const remainingSeconds = state.isRunning || state.isComplete
    ? Math.max(0, state.targetSeconds - elapsedSeconds)
    : state.targetSeconds;

  const progress = state.targetSeconds > 0
    ? Math.min(1, elapsedSeconds / state.targetSeconds)
    : 0;

  // Update elapsed every second when running
  useEffect(() => {
    completedRef.current = false;

    if (state.isRunning && !state.isPaused) {
      setElapsedSeconds(calcElapsed());
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(calcElapsed());
      }, 1000);
    } else if (state.isPaused) {
      setElapsedSeconds(calcElapsed());
    } else if (!state.isComplete) {
      setElapsedSeconds(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning, state.isPaused, state.isComplete, calcElapsed]);

  // Check for completion
  useEffect(() => {
    if (
      state.isRunning &&
      !state.isPaused &&
      !state.isComplete &&
      remainingSeconds <= 0 &&
      elapsedSeconds > 0 &&
      !completedRef.current
    ) {
      completedRef.current = true;
      playCountdownComplete();
      toast.success("Time's up!", {
        description: `Logged ${formatDuration(state.targetSeconds)}`,
      });
      sendNotification("Countdown complete!", "Your timer has finished.");

      // Save time entry
      if (state.startTime) {
        fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: state.description,
            startTime: new Date(state.startTime).toISOString(),
            endTime: new Date(Date.now()).toISOString(),
            projectId: state.projectId || null,
            tagIds: [],
          }),
        }).catch(() => {});
      }

      const newState: CountdownState = {
        ...state,
        isRunning: false,
        isComplete: true,
      };
      setState(newState);
      saveState(newState);
    }
  }, [state, remainingSeconds, elapsedSeconds]);

  // Re-calc on tab visibility change
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible" && state.isRunning && !state.isPaused) {
        setElapsedSeconds(calcElapsed());
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [state.isRunning, state.isPaused, calcElapsed]);

  const start = useCallback((projectId?: string | null, description?: string) => {
    const newState: CountdownState = {
      isRunning: true,
      isPaused: false,
      startTime: Date.now(),
      pausedDuration: 0,
      pauseStart: null,
      targetSeconds: state.targetSeconds,
      isComplete: false,
      projectId: projectId ?? null,
      description: description ?? "",
    };
    setState(newState);
    saveState(newState);
  }, [state.targetSeconds]);

  const pause = useCallback(() => {
    toast("Countdown paused");
    setState((prev) => {
      const newState = { ...prev, isPaused: true, pauseStart: Date.now() };
      saveState(newState);
      return newState;
    });
  }, []);

  const resume = useCallback(() => {
    toast("Countdown resumed");
    setState((prev) => {
      const additionalPause = prev.pauseStart ? Date.now() - prev.pauseStart : 0;
      const newState: CountdownState = {
        ...prev,
        isPaused: false,
        pauseStart: null,
        pausedDuration: prev.pausedDuration + additionalPause,
      };
      saveState(newState);
      return newState;
    });
  }, []);

  const reset = useCallback(() => {
    const newState: CountdownState = {
      ...DEFAULT_STATE,
      targetSeconds: state.targetSeconds,
    };
    setState(newState);
    saveState(newState);
    setElapsedSeconds(0);
  }, [state.targetSeconds]);

  const setDuration = useCallback((seconds: number) => {
    if (state.isRunning) return;
    const newState: CountdownState = {
      ...DEFAULT_STATE,
      targetSeconds: seconds,
    };
    setState(newState);
    saveState(newState);
    setElapsedSeconds(0);
  }, [state.isRunning]);

  const setDescription = useCallback((description: string) => {
    setState((prev) => {
      const newState = { ...prev, description };
      saveState(newState);
      return newState;
    });
  }, []);

  const setProjectId = useCallback((projectId: string | null) => {
    setState((prev) => {
      const newState = { ...prev, projectId };
      saveState(newState);
      return newState;
    });
  }, []);

  return {
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    isComplete: state.isComplete,
    remainingSeconds,
    totalDurationSeconds: state.targetSeconds,
    progress,
    projectId: state.projectId,
    description: state.description,
    start,
    pause,
    resume,
    reset,
    setDuration,
    setDescription,
    setProjectId,
  };
}
