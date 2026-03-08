"use client";

import { useEffect, useRef } from "react";
import { formatTimerDisplay, formatCountdown } from "@/lib/utils";
import { ProgressRing } from "./progress-ring";
import type { TimerMode, PomodoroPhase } from "@/lib/hooks/use-timer";

interface TimerDisplayProps {
  seconds: number;
  remainingSeconds: number;
  targetSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  mode: TimerMode;
  pomodoroPhase: PomodoroPhase;
  pomodoroCount: number;
  cyclesBeforeLongBreak: number;
}

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  work: "WORK",
  shortBreak: "SHORT BREAK",
  longBreak: "LONG BREAK",
};

const PHASE_COLORS: Record<PomodoroPhase, string> = {
  work: "text-[#FF6B35]",
  shortBreak: "text-[#FFD166]",
  longBreak: "text-[#FF8C42]",
};

export function TimerDisplay({
  seconds,
  remainingSeconds,
  targetSeconds,
  isRunning,
  isPaused,
  mode,
  pomodoroPhase,
  pomodoroCount,
  cyclesBeforeLongBreak,
}: TimerDisplayProps) {
  const isPomodoro = mode === "pomodoro";
  const displayTime = isPomodoro ? formatCountdown(remainingSeconds) : formatTimerDisplay(seconds);
  const prevSecondsRef = useRef(seconds);
  const tickRef = useRef<HTMLParagraphElement>(null);

  // Blip animation on each second tick
  useEffect(() => {
    if (isRunning && !isPaused && seconds !== prevSecondsRef.current) {
      prevSecondsRef.current = seconds;
      const el = tickRef.current;
      if (el) {
        el.classList.remove("animate-digit-tick");
        void el.offsetWidth; // force reflow
        el.classList.add("animate-digit-tick");
      }
    }
  }, [seconds, isRunning, isPaused]);

  const timeColor = isPaused
    ? "text-[#A89070]"
    : isRunning
      ? isPomodoro
        ? PHASE_COLORS[pomodoroPhase] + " led-glow"
        : "text-primary led-glow"
      : "text-[#F5E6D0]/70";

  let statusText: string;
  if (isPomodoro) {
    if (isPaused) statusText = `${PHASE_LABELS[pomodoroPhase]} // PAUSED`;
    else if (isRunning) statusText = PHASE_LABELS[pomodoroPhase];
    else statusText = `${PHASE_LABELS[pomodoroPhase]} // READY`;
  } else {
    statusText = isPaused ? "// PAUSED" : isRunning ? "// RUNNING" : "// READY";
  }

  const progress = isPomodoro && targetSeconds > 0
    ? Math.min(1, seconds / targetSeconds)
    : 0;

  const digits = (
    <p
      ref={tickRef}
      className={`font-pixel text-2xl sm:text-3xl tabular-nums tracking-wider ${timeColor} ${
        isPaused ? "animate-pulse" : ""
      }`}
    >
      {displayTime}
    </p>
  );

  return (
    <div className="flex flex-col items-center">
      {isPomodoro ? (
        <ProgressRing
          progress={progress}
          isRunning={isRunning}
          isPaused={isPaused}
          colorClass={isPaused ? "text-[#A89070]" : PHASE_COLORS[pomodoroPhase]}
        >
          {digits}
        </ProgressRing>
      ) : (
        <div className="py-6">
          {digits}
        </div>
      )}

      {/* Status label */}
      <p className="mt-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[#A89070]">
        {statusText}
      </p>

      {/* Pomodoro cycle dots — square pixels instead of circles */}
      {isPomodoro && (
        <div className="mt-3 flex justify-center gap-2">
          {Array.from({ length: cyclesBeforeLongBreak }).map((_, i) => (
            <div
              key={i}
              className={`h-2.5 w-2.5 rounded-sm transition-all duration-300 ${
                i < pomodoroCount
                  ? "bg-[#FF8C42] animate-pop-in"
                  : i === pomodoroCount && pomodoroPhase === "work" && isRunning
                    ? "bg-[#FF8C42]/40"
                    : "bg-[#3D322C]"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
