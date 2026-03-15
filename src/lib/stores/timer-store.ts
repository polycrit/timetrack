import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import {
  playWorkStart,
  playWorkComplete,
  playBreakOver,
  playTimerStop,
  playPause,
  playResume,
  playCountdownComplete,
} from "@/lib/sounds";
import { formatDuration } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimerMode = "free" | "pomodoro";
export type PomodoroPhase = "work" | "shortBreak" | "longBreak";

export interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  notificationsEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  autoStartBreaks: true,
  autoStartWork: false,
  notificationsEnabled: true,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sendNotification(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function calcElapsed(
  startTime: number | null,
  isPaused: boolean,
  pauseStart: number | null,
  pausedDuration: number,
): number {
  if (!startTime) return 0;
  const now = isPaused && pauseStart ? pauseStart : Date.now();
  return Math.floor((now - startTime - pausedDuration) / 1000);
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface TimerStore {
  // --- Timer state ---
  timer: {
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
  };
  timerElapsed: number;
  _phaseCompleted: boolean;

  // Timer actions
  timerStart: (projectId: string | null, description: string) => void;
  timerPause: () => void;
  timerResume: () => void;
  timerStop: () => { durationSeconds: number } | null;
  timerSetDescription: (description: string) => void;
  timerSetProjectId: (projectId: string | null) => void;
  timerSetMode: (mode: TimerMode) => void;
  timerSkipPhase: () => void;
  timerTick: () => void;

  // --- Countdown state ---
  countdown: {
    isRunning: boolean;
    isPaused: boolean;
    startTime: number | null;
    pausedDuration: number;
    pauseStart: number | null;
    targetSeconds: number;
    isComplete: boolean;
    projectId: string | null;
    description: string;
  };
  countdownElapsed: number;
  _countdownCompleted: boolean;

  // Countdown actions
  countdownStart: (projectId?: string | null, description?: string) => void;
  countdownPause: () => void;
  countdownResume: () => void;
  countdownReset: () => void;
  countdownSetDuration: (seconds: number) => void;
  countdownSetDescription: (description: string) => void;
  countdownSetProjectId: (projectId: string | null) => void;
  countdownTick: () => void;

  // --- Pomodoro settings ---
  pomodoroSettings: PomodoroSettings;
  updatePomodoroSettings: (updates: Partial<PomodoroSettings>) => void;
  resetPomodoroSettings: () => void;
}

// ---------------------------------------------------------------------------
// Default sub-states
// ---------------------------------------------------------------------------

const DEFAULT_TIMER = {
  isRunning: false,
  isPaused: false,
  startTime: null as number | null,
  pausedDuration: 0,
  pauseStart: null as number | null,
  projectId: null as string | null,
  description: "",
  mode: "free" as TimerMode,
  pomodoroPhase: "work" as PomodoroPhase,
  pomodoroCount: 0,
  pomodoroTargetSeconds: 25 * 60,
};

const DEFAULT_COUNTDOWN = {
  isRunning: false,
  isPaused: false,
  startTime: null as number | null,
  pausedDuration: 0,
  pauseStart: null as number | null,
  targetSeconds: 25 * 60,
  isComplete: false,
  projectId: null as string | null,
  description: "",
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      // =====================================================================
      // Timer slice
      // =====================================================================
      timer: { ...DEFAULT_TIMER },
      timerElapsed: 0,
      _phaseCompleted: false,

      timerStart: (projectId, description) => {
        const { timer } = get();
        const isBreak =
          timer.mode === "pomodoro" &&
          (timer.pomodoroPhase === "shortBreak" || timer.pomodoroPhase === "longBreak");

        playWorkStart();
        toast(isBreak ? "Break started" : "Timer started", {
          description: description || undefined,
        });

        set({
          timer: {
            ...timer,
            isRunning: true,
            isPaused: false,
            startTime: Date.now(),
            pausedDuration: 0,
            pauseStart: null,
            projectId,
            description,
          },
          timerElapsed: 0,
          _phaseCompleted: false,
        });
      },

      timerPause: () => {
        playPause();
        toast("Timer paused");
        set((s) => ({
          timer: { ...s.timer, isPaused: true, pauseStart: Date.now() },
        }));
      },

      timerResume: () => {
        playResume();
        toast("Timer resumed");
        set((s) => {
          const additionalPause = s.timer.pauseStart
            ? Date.now() - s.timer.pauseStart
            : 0;
          return {
            timer: {
              ...s.timer,
              isPaused: false,
              pauseStart: null,
              pausedDuration: s.timer.pausedDuration + additionalPause,
            },
          };
        });
      },

      timerStop: () => {
        const { timer, pomodoroSettings } = get();
        if (!timer.startTime) return null;

        const endTime = Date.now();
        let totalPaused = timer.pausedDuration;
        if (timer.isPaused && timer.pauseStart) {
          totalPaused += endTime - timer.pauseStart;
        }
        const durationMs = endTime - timer.startTime - totalPaused;
        const durationSeconds = Math.round(durationMs / 1000);

        playTimerStop();
        toast("Timer stopped", {
          description: `Logged ${formatDuration(durationSeconds)}`,
        });

        set({
          timer: {
            ...DEFAULT_TIMER,
            mode: timer.mode,
            pomodoroPhase: "work",
            pomodoroCount: 0,
            pomodoroTargetSeconds: pomodoroSettings.workMinutes * 60,
          },
          timerElapsed: 0,
          _phaseCompleted: false,
        });

        // Save entry in the background
        if (timer.mode === "free" || timer.pomodoroPhase === "work") {
          fetch("/api/entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              description: timer.description,
              startTime: new Date(timer.startTime).toISOString(),
              endTime: new Date(endTime).toISOString(),
              projectId: timer.projectId || null,
              tagIds: [],
            }),
          }).catch((err) => {
            console.error("Failed to save time entry", err);
          });
        }

        return { durationSeconds };
      },

      timerSetDescription: (description) => {
        set((s) => ({ timer: { ...s.timer, description } }));
      },

      timerSetProjectId: (projectId) => {
        set((s) => ({ timer: { ...s.timer, projectId } }));
      },

      timerSetMode: (mode) => {
        const { timer } = get();
        if (timer.isRunning) return;
        set({
          timer: {
            ...timer,
            mode,
            isRunning: false,
            isPaused: false,
            startTime: null,
            pausedDuration: 0,
            pauseStart: null,
          },
        });
      },

      timerSkipPhase: () => {
        const { timer, pomodoroSettings } = get();
        if (timer.mode !== "pomodoro" || !timer.isRunning) return;

        if (timer.pomodoroPhase === "work") {
          // Save partial work entry
          if (timer.startTime) {
            fetch("/api/entries", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                description: timer.description,
                startTime: new Date(timer.startTime).toISOString(),
                endTime: new Date().toISOString(),
                projectId: timer.projectId || null,
                tagIds: [],
              }),
            }).catch(() => {});
          }

          const newCount = timer.pomodoroCount + 1;
          const isLongBreak = newCount >= pomodoroSettings.cyclesBeforeLongBreak;
          const nextPhase: PomodoroPhase = isLongBreak ? "longBreak" : "shortBreak";
          const breakMinutes = isLongBreak
            ? pomodoroSettings.longBreakMinutes
            : pomodoroSettings.shortBreakMinutes;

          toast("Skipped to break", {
            description: `Starting ${isLongBreak ? "long" : "short"} break`,
          });

          set({
            timer: {
              ...timer,
              pomodoroPhase: nextPhase,
              pomodoroCount: isLongBreak ? 0 : newCount,
              pomodoroTargetSeconds: breakMinutes * 60,
              startTime: Date.now(),
              pausedDuration: 0,
              pauseStart: null,
              isPaused: false,
            },
            timerElapsed: 0,
            _phaseCompleted: false,
          });
        } else {
          toast("Skipped to work", {
            description: "Break skipped — back to it!",
          });

          set({
            timer: {
              ...timer,
              pomodoroPhase: "work",
              pomodoroTargetSeconds: pomodoroSettings.workMinutes * 60,
              startTime: Date.now(),
              pausedDuration: 0,
              pauseStart: null,
              isPaused: false,
            },
            timerElapsed: 0,
            _phaseCompleted: false,
          });
        }
      },

      timerTick: () => {
        const { timer, _phaseCompleted, pomodoroSettings } = get();
        if (!timer.isRunning || timer.isPaused) return;

        const elapsed = calcElapsed(
          timer.startTime,
          timer.isPaused,
          timer.pauseStart,
          timer.pausedDuration,
        );

        set({ timerElapsed: elapsed });

        // Check pomodoro phase completion
        if (
          timer.mode === "pomodoro" &&
          !_phaseCompleted &&
          elapsed > 0 &&
          elapsed >= timer.pomodoroTargetSeconds
        ) {
          set({ _phaseCompleted: true });

          if (timer.pomodoroPhase === "work") {
            // Save work entry
            if (timer.startTime) {
              fetch("/api/entries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  description: timer.description,
                  startTime: new Date(timer.startTime).toISOString(),
                  endTime: new Date().toISOString(),
                  projectId: timer.projectId || null,
                  tagIds: [],
                }),
              }).catch(() => {});
            }

            const newCount = timer.pomodoroCount + 1;
            const isLongBreak = newCount >= pomodoroSettings.cyclesBeforeLongBreak;
            const nextPhase: PomodoroPhase = isLongBreak ? "longBreak" : "shortBreak";
            const breakMinutes = isLongBreak
              ? pomodoroSettings.longBreakMinutes
              : pomodoroSettings.shortBreakMinutes;

            playWorkComplete();
            toast.success("Work session complete!", {
              description: `Time for a ${isLongBreak ? "long" : "short"} break.`,
            });
            if (pomodoroSettings.notificationsEnabled) {
              sendNotification(
                "Work session complete!",
                `Time for a ${isLongBreak ? "long" : "short"} break.`,
              );
            }

            set({
              timer: {
                ...timer,
                pomodoroPhase: nextPhase,
                pomodoroCount: isLongBreak ? 0 : newCount,
                pomodoroTargetSeconds: breakMinutes * 60,
                startTime: pomodoroSettings.autoStartBreaks ? Date.now() : null,
                isRunning: pomodoroSettings.autoStartBreaks,
                isPaused: false,
                pausedDuration: 0,
                pauseStart: null,
              },
              timerElapsed: 0,
              _phaseCompleted: false,
            });
          } else {
            // Break complete
            playBreakOver();
            toast("Break over!", {
              description: "Ready to get back to work?",
            });
            if (pomodoroSettings.notificationsEnabled) {
              sendNotification("Break over!", "Ready to get back to work?");
            }

            set({
              timer: {
                ...timer,
                pomodoroPhase: "work",
                pomodoroTargetSeconds: pomodoroSettings.workMinutes * 60,
                startTime: pomodoroSettings.autoStartWork ? Date.now() : null,
                isRunning: pomodoroSettings.autoStartWork,
                isPaused: false,
                pausedDuration: 0,
                pauseStart: null,
              },
              timerElapsed: 0,
              _phaseCompleted: false,
            });
          }
        }
      },

      // =====================================================================
      // Countdown slice
      // =====================================================================
      countdown: { ...DEFAULT_COUNTDOWN },
      countdownElapsed: 0,
      _countdownCompleted: false,

      countdownStart: (projectId, description) => {
        const { countdown } = get();
        playWorkStart();

        set({
          countdown: {
            ...countdown,
            isRunning: true,
            isPaused: false,
            startTime: Date.now(),
            pausedDuration: 0,
            pauseStart: null,
            isComplete: false,
            projectId: projectId ?? null,
            description: description ?? "",
          },
          countdownElapsed: 0,
          _countdownCompleted: false,
        });
      },

      countdownPause: () => {
        playPause();
        toast("Countdown paused");
        set((s) => ({
          countdown: { ...s.countdown, isPaused: true, pauseStart: Date.now() },
        }));
      },

      countdownResume: () => {
        playResume();
        toast("Countdown resumed");
        set((s) => {
          const additionalPause = s.countdown.pauseStart
            ? Date.now() - s.countdown.pauseStart
            : 0;
          return {
            countdown: {
              ...s.countdown,
              isPaused: false,
              pauseStart: null,
              pausedDuration: s.countdown.pausedDuration + additionalPause,
            },
          };
        });
      },

      countdownReset: () => {
        const { countdown } = get();
        playTimerStop();
        set({
          countdown: { ...DEFAULT_COUNTDOWN, targetSeconds: countdown.targetSeconds },
          countdownElapsed: 0,
          _countdownCompleted: false,
        });
      },

      countdownSetDuration: (seconds) => {
        const { countdown } = get();
        if (countdown.isRunning) return;
        set({
          countdown: { ...DEFAULT_COUNTDOWN, targetSeconds: seconds },
          countdownElapsed: 0,
        });
      },

      countdownSetDescription: (description) => {
        set((s) => ({ countdown: { ...s.countdown, description } }));
      },

      countdownSetProjectId: (projectId) => {
        set((s) => ({ countdown: { ...s.countdown, projectId } }));
      },

      countdownTick: () => {
        const { countdown, _countdownCompleted } = get();
        if (!countdown.isRunning || countdown.isPaused || countdown.isComplete) return;

        const elapsed = calcElapsed(
          countdown.startTime,
          countdown.isPaused,
          countdown.pauseStart,
          countdown.pausedDuration,
        );

        set({ countdownElapsed: elapsed });

        // Check completion
        const remaining = countdown.targetSeconds - elapsed;
        if (!_countdownCompleted && elapsed > 0 && remaining <= 0) {
          set({ _countdownCompleted: true });

          playCountdownComplete();
          toast.success("Time's up!", {
            description: `Logged ${formatDuration(countdown.targetSeconds)}`,
          });
          sendNotification("Countdown complete!", "Your timer has finished.");

          // Save entry
          if (countdown.startTime) {
            fetch("/api/entries", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                description: countdown.description,
                startTime: new Date(countdown.startTime).toISOString(),
                endTime: new Date().toISOString(),
                projectId: countdown.projectId || null,
                tagIds: [],
              }),
            }).catch(() => {});
          }

          set({
            countdown: { ...countdown, isRunning: false, isComplete: true },
          });
        }
      },

      // =====================================================================
      // Pomodoro settings slice
      // =====================================================================
      pomodoroSettings: { ...DEFAULT_SETTINGS },

      updatePomodoroSettings: (updates) => {
        set((s) => {
          const next = { ...s.pomodoroSettings, ...updates };

          // Sync target seconds when timer is idle
          if (!s.timer.isRunning && s.timer.mode === "pomodoro") {
            const targetForPhase =
              s.timer.pomodoroPhase === "work"
                ? next.workMinutes * 60
                : s.timer.pomodoroPhase === "shortBreak"
                  ? next.shortBreakMinutes * 60
                  : next.longBreakMinutes * 60;

            return {
              pomodoroSettings: next,
              timer: { ...s.timer, pomodoroTargetSeconds: targetForPhase },
            };
          }

          return { pomodoroSettings: next };
        });
      },

      resetPomodoroSettings: () => {
        set((s) => {
          const result: Partial<TimerStore> = {
            pomodoroSettings: { ...DEFAULT_SETTINGS },
          };

          if (!s.timer.isRunning && s.timer.mode === "pomodoro") {
            const targetForPhase =
              s.timer.pomodoroPhase === "work"
                ? DEFAULT_SETTINGS.workMinutes * 60
                : s.timer.pomodoroPhase === "shortBreak"
                  ? DEFAULT_SETTINGS.shortBreakMinutes * 60
                  : DEFAULT_SETTINGS.longBreakMinutes * 60;

            result.timer = { ...s.timer, pomodoroTargetSeconds: targetForPhase };
          }

          return result;
        });
      },
    }),
    {
      name: "timetrack-store",
      skipHydration: true,
      partialize: (state) => ({
        timer: state.timer,
        countdown: state.countdown,
        pomodoroSettings: state.pomodoroSettings,
      }),
      // Migrate from legacy separate localStorage keys
      onRehydrateStorage: () => {
        return (state) => {
          if (!state || typeof window === "undefined") return;

          // One-time migration from old keys
          try {
            const legacyTimer = localStorage.getItem("timetrack-timer");
            const legacyCountdown = localStorage.getItem("timetrack-countdown");
            const legacySettings = localStorage.getItem("timetrack-pomodoro-settings");

            let migrated = false;

            if (legacyTimer) {
              const parsed = JSON.parse(legacyTimer);
              state.timer = { ...DEFAULT_TIMER, ...parsed };
              migrated = true;
              localStorage.removeItem("timetrack-timer");
            }

            if (legacyCountdown) {
              const parsed = JSON.parse(legacyCountdown);
              state.countdown = { ...DEFAULT_COUNTDOWN, ...parsed };
              migrated = true;
              localStorage.removeItem("timetrack-countdown");
            }

            if (legacySettings) {
              const parsed = JSON.parse(legacySettings);
              state.pomodoroSettings = { ...DEFAULT_SETTINGS, ...parsed };
              migrated = true;
              localStorage.removeItem("timetrack-pomodoro-settings");
            }

            if (migrated) {
              // Persist the migrated state
              useTimerStore.persist.rehydrate();
            }
          } catch {
            // ignore migration errors
          }
        };
      },
    },
  ),
);
