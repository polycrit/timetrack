"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { PomodoroSettings } from "./use-pomodoro-settings";
import { playWorkStart, playWorkComplete, playBreakOver, playTimerStop } from "@/lib/sounds";
import { formatDuration } from "@/lib/utils";

export type TimerMode = "free" | "pomodoro";
export type PomodoroPhase = "work" | "shortBreak" | "longBreak";

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pausedDuration: number;
  pauseStart: number | null;
  projectId: string | null;
  description: string;
  mode: TimerMode;
  pomodoroPhase: PomodoroPhase;
  pomodoroCount: number;
  pomodoroTargetSeconds: number;
}

const STORAGE_KEY = "timetrack-timer";

const DEFAULT_STATE: TimerState = {
  isRunning: false,
  isPaused: false,
  startTime: null,
  pausedDuration: 0,
  pauseStart: null,
  projectId: null,
  description: "",
  mode: "free",
  pomodoroPhase: "work",
  pomodoroCount: 0,
  pomodoroTargetSeconds: 25 * 60,
};

function loadState(): TimerState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_STATE, ...JSON.parse(stored) };
  } catch {
    // ignore
  }
  return DEFAULT_STATE;
}

function saveState(state: TimerState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function sendNotification(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

export function useTimer(pomodoroSettings?: PomodoroSettings) {
  const [state, setState] = useState<TimerState>(DEFAULT_STATE);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pomodoroCompletedRef = useRef(false);

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

  const remainingSeconds =
    state.mode === "pomodoro"
      ? Math.max(0, state.pomodoroTargetSeconds - elapsedSeconds)
      : 0;

  // Save a work session entry to the API
  const saveEntry = useCallback(async (timerState: TimerState) => {
    if (!timerState.startTime) return;
    const endTime = Date.now();
    const entry = {
      description: timerState.description,
      startTime: new Date(timerState.startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      projectId: timerState.projectId || null,
      tagIds: [],
    };
    await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  }, []);

  // Handle Pomodoro phase completion
  const handlePhaseComplete = useCallback(async () => {
    if (pomodoroCompletedRef.current) return;
    pomodoroCompletedRef.current = true;

    const settings = pomodoroSettings;
    if (!settings) return;

    if (state.pomodoroPhase === "work") {
      // Save the work entry
      await saveEntry(state);

      const newCount = state.pomodoroCount + 1;
      const isLongBreak = newCount >= settings.cyclesBeforeLongBreak;
      const nextPhase: PomodoroPhase = isLongBreak ? "longBreak" : "shortBreak";
      const breakMinutes = isLongBreak ? settings.longBreakMinutes : settings.shortBreakMinutes;

      playWorkComplete();
      toast.success("Work session complete!", {
        description: `Time for a ${isLongBreak ? "long" : "short"} break.`,
      });
      if (settings.notificationsEnabled) {
        sendNotification("Work session complete!", `Time for a ${isLongBreak ? "long" : "short"} break.`);
      }

      const newState: TimerState = {
        ...state,
        pomodoroPhase: nextPhase,
        pomodoroCount: isLongBreak ? 0 : newCount,
        pomodoroTargetSeconds: breakMinutes * 60,
        startTime: settings.autoStartBreaks ? Date.now() : null,
        isRunning: settings.autoStartBreaks,
        isPaused: false,
        pausedDuration: 0,
        pauseStart: null,
      };
      setElapsedSeconds(0);
      setState(newState);
      saveState(newState);
    } else {
      // Break complete
      playBreakOver();
      toast("Break over!", {
        description: "Ready to get back to work?",
      });
      if (settings.notificationsEnabled) {
        sendNotification("Break over!", "Ready to get back to work?");
      }

      const newState: TimerState = {
        ...state,
        pomodoroPhase: "work",
        pomodoroTargetSeconds: settings.workMinutes * 60,
        startTime: settings.autoStartWork ? Date.now() : null,
        isRunning: settings.autoStartWork,
        isPaused: false,
        pausedDuration: 0,
        pauseStart: null,
      };
      setElapsedSeconds(0);
      setState(newState);
      saveState(newState);
    }
  }, [state, pomodoroSettings, saveEntry]);

  // Update elapsed every second when running
  useEffect(() => {
    pomodoroCompletedRef.current = false;

    if (state.isRunning && !state.isPaused) {
      setElapsedSeconds(calcElapsed());
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(calcElapsed());
      }, 1000);
    } else if (state.isPaused) {
      setElapsedSeconds(calcElapsed());
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning, state.isPaused, calcElapsed]);

  // Check for Pomodoro phase completion
  useEffect(() => {
    if (
      state.mode === "pomodoro" &&
      state.isRunning &&
      !state.isPaused &&
      remainingSeconds <= 0 &&
      elapsedSeconds > 0
    ) {
      handlePhaseComplete();
    }
  }, [state.mode, state.isRunning, state.isPaused, remainingSeconds, elapsedSeconds, handlePhaseComplete]);

  // Sync pomodoroTargetSeconds when settings change and timer is idle
  useEffect(() => {
    if (!pomodoroSettings || state.mode !== "pomodoro" || state.isRunning) return;

    const targetForPhase =
      state.pomodoroPhase === "work"
        ? pomodoroSettings.workMinutes * 60
        : state.pomodoroPhase === "shortBreak"
          ? pomodoroSettings.shortBreakMinutes * 60
          : pomodoroSettings.longBreakMinutes * 60;

    if (state.pomodoroTargetSeconds !== targetForPhase) {
      setState((prev) => {
        const newState = { ...prev, pomodoroTargetSeconds: targetForPhase };
        saveState(newState);
        return newState;
      });
    }
  }, [
    pomodoroSettings,
    state.mode,
    state.isRunning,
    state.pomodoroPhase,
    state.pomodoroTargetSeconds,
  ]);

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

  const start = useCallback((projectId: string | null, description: string) => {
    playWorkStart();
    const isBreak = state.mode === "pomodoro" &&
      (state.pomodoroPhase === "shortBreak" || state.pomodoroPhase === "longBreak");
    toast(isBreak ? "Break started" : "Timer started", {
      description: description || undefined,
    });
    const newState: TimerState = {
      ...state,
      isRunning: true,
      isPaused: false,
      startTime: Date.now(),
      pausedDuration: 0,
      pauseStart: null,
      projectId,
      description,
    };
    setState(newState);
    saveState(newState);
  }, [state]);

  const pause = useCallback(() => {
    toast("Timer paused");
    setState((prev) => {
      const newState = { ...prev, isPaused: true, pauseStart: Date.now() };
      saveState(newState);
      return newState;
    });
  }, []);

  const resume = useCallback(() => {
    toast("Timer resumed");
    setState((prev) => {
      const additionalPause = prev.pauseStart ? Date.now() - prev.pauseStart : 0;
      const newState: TimerState = {
        ...prev,
        isPaused: false,
        pauseStart: null,
        pausedDuration: prev.pausedDuration + additionalPause,
      };
      saveState(newState);
      return newState;
    });
  }, []);

  const stop = useCallback(async () => {
    if (!state.startTime) return null;

    const endTime = Date.now();
    let totalPaused = state.pausedDuration;
    if (state.isPaused && state.pauseStart) {
      totalPaused += endTime - state.pauseStart;
    }
    const durationMs = endTime - state.startTime - totalPaused;
    const durationSeconds = Math.round(durationMs / 1000);

    // Only save entry for work phases (or free mode)
    if (state.mode === "free" || state.pomodoroPhase === "work") {
      const entry = {
        description: state.description,
        startTime: new Date(state.startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        projectId: state.projectId || null,
        tagIds: [],
      };

      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        console.error("Failed to save time entry", response.status, err);
      }
    }

    playTimerStop();
    toast("Timer stopped", {
      description: `Logged ${formatDuration(durationSeconds)}`,
    });

    const resetState: TimerState = {
      ...DEFAULT_STATE,
      mode: state.mode,
      pomodoroPhase: "work",
      pomodoroCount: 0,
      pomodoroTargetSeconds: pomodoroSettings
        ? pomodoroSettings.workMinutes * 60
        : 25 * 60,
    };
    setState(resetState);
    saveState(resetState);

    return { durationSeconds };
  }, [state, pomodoroSettings]);

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

  const setMode = useCallback((mode: TimerMode) => {
    if (state.isRunning) return; // Can't switch modes while running
    const newState: TimerState = {
      ...state,
      mode,
      isRunning: false,
      isPaused: false,
      startTime: null,
      pausedDuration: 0,
      pauseStart: null,
    };
    setState(newState);
    saveState(newState);
  }, [state]);

  const skipPhase = useCallback(() => {
    if (state.mode !== "pomodoro" || !state.isRunning) return;

    const settings = pomodoroSettings;
    if (!settings) return;

    if (state.pomodoroPhase === "work") {
      // Skipping work — save partial entry, move to break
      saveEntry(state);
      const newCount = state.pomodoroCount + 1;
      const isLongBreak = newCount >= settings.cyclesBeforeLongBreak;
      const nextPhase: PomodoroPhase = isLongBreak ? "longBreak" : "shortBreak";
      const breakMinutes = isLongBreak ? settings.longBreakMinutes : settings.shortBreakMinutes;

      toast("Skipped to break", {
        description: `Starting ${isLongBreak ? "long" : "short"} break`,
      });

      const newState: TimerState = {
        ...state,
        pomodoroPhase: nextPhase,
        pomodoroCount: isLongBreak ? 0 : newCount,
        pomodoroTargetSeconds: breakMinutes * 60,
        startTime: Date.now(),
        pausedDuration: 0,
        pauseStart: null,
        isPaused: false,
      };
      setElapsedSeconds(0);
      setState(newState);
      saveState(newState);
    } else {
      // Skipping break — move to work
      toast("Skipped to work", {
        description: "Break skipped — back to it!",
      });

      const newState: TimerState = {
        ...state,
        pomodoroPhase: "work",
        pomodoroTargetSeconds: settings.workMinutes * 60,
        startTime: Date.now(),
        pausedDuration: 0,
        pauseStart: null,
        isPaused: false,
      };
      setElapsedSeconds(0);
      setState(newState);
      saveState(newState);
    }
  }, [state, pomodoroSettings, saveEntry]);

  return {
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    elapsedSeconds,
    remainingSeconds,
    projectId: state.projectId,
    description: state.description,
    mode: state.mode,
    pomodoroPhase: state.pomodoroPhase,
    pomodoroCount: state.pomodoroCount,
    pomodoroTargetSeconds: state.pomodoroTargetSeconds,
    start,
    pause,
    resume,
    stop,
    setDescription,
    setProjectId,
    setMode,
    skipPhase,
  };
}
