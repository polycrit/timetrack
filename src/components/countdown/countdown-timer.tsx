"use client";

import { useEffect, useRef, useState } from "react";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { formatCountdownDisplay } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, RotateCcw } from "lucide-react";

const PRESETS = [
  { label: "5m", seconds: 5 * 60 },
  { label: "10m", seconds: 10 * 60 },
  { label: "15m", seconds: 15 * 60 },
  { label: "25m", seconds: 25 * 60 },
  { label: "45m", seconds: 45 * 60 },
  { label: "60m", seconds: 60 * 60 },
];

function ProgressRing({
  progress,
  isRunning,
  isPaused,
  isComplete,
  children,
}: {
  progress: number;
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  children: React.ReactNode;
}) {
  const size = 220;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const remaining = 1 - progress;
  const dashOffset = circumference * (1 - remaining);

  const ringRef = useRef<SVGCircleElement>(null);
  const prevCompleteRef = useRef(false);

  useEffect(() => {
    if (isComplete && !prevCompleteRef.current) {
      const el = ringRef.current;
      if (el) {
        el.classList.remove("animate-ring-complete");
        void el.getBoundingClientRect();
        el.classList.add("animate-ring-complete");
      }
    }
    prevCompleteRef.current = isComplete;
  }, [isComplete]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
        />
        {/* Active ring */}
        <circle
          ref={ringRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={cn(
            "transition-[stroke-dashoffset] duration-1000 ease-linear",
            isComplete
              ? "text-accent animate-glow-pulse"
              : isPaused
                ? "text-muted-foreground"
                : isRunning
                  ? "text-accent"
                  : "text-accent/50"
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export function CountdownTimer() {
  const countdown = useCountdown();
  const [customMinutes, setCustomMinutes] = useState("");
  const tickRef = useRef<HTMLParagraphElement>(null);
  const prevSecondsRef = useRef(countdown.remainingSeconds);

  // Digit tick animation on each second change
  useEffect(() => {
    if (
      countdown.isRunning &&
      !countdown.isPaused &&
      countdown.remainingSeconds !== prevSecondsRef.current
    ) {
      prevSecondsRef.current = countdown.remainingSeconds;
      const el = tickRef.current;
      if (el) {
        el.classList.remove("animate-digit-tick");
        void el.offsetWidth;
        el.classList.add("animate-digit-tick");
      }
    }
  }, [countdown.remainingSeconds, countdown.isRunning, countdown.isPaused]);

  function handleCustomSet() {
    const mins = parseInt(customMinutes, 10);
    if (mins > 0) {
      countdown.setDuration(mins * 60);
      setCustomMinutes("");
    }
  }

  const timeColor = countdown.isComplete
    ? "text-accent animate-glow-pulse"
    : countdown.isPaused
      ? "text-muted-foreground animate-pulse"
      : countdown.isRunning
        ? "text-accent"
        : "text-foreground/70";

  let statusText: string;
  if (countdown.isComplete) statusText = "// COMPLETE";
  else if (countdown.isPaused) statusText = "// PAUSED";
  else if (countdown.isRunning) statusText = "// COUNTING DOWN";
  else statusText = "// SET TIMER";

  const showPicker = !countdown.isRunning && !countdown.isComplete;

  return (
    <Card className="retro-bevel animate-card-appear">
      <CardContent className="space-y-6 py-6">
        {/* Duration picker */}
        {showPicker && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 justify-center">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  variant={
                    countdown.totalDurationSeconds === p.seconds
                      ? "secondary"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => countdown.setDuration(p.seconds)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 justify-center max-w-xs mx-auto">
              <Input
                type="number"
                min="1"
                placeholder="Minutes"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCustomSet();
                }}
                className="w-24 text-center"
              />
              <Button variant="outline" size="sm" onClick={handleCustomSet}>
                Set
              </Button>
            </div>
          </div>
        )}

        {/* Progress ring + digits */}
        <div className="flex justify-center">
          <ProgressRing
            progress={countdown.progress}
            isRunning={countdown.isRunning}
            isPaused={countdown.isPaused}
            isComplete={countdown.isComplete}
          >
            <p
              ref={tickRef}
              className={`font-pixel text-2xl sm:text-3xl tabular-nums tracking-wider ${timeColor}`}
            >
              {formatCountdownDisplay(countdown.remainingSeconds)}
            </p>
          </ProgressRing>
        </div>

        {/* Status label */}
        <p className="text-center font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {statusText}
        </p>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          {!countdown.isRunning && !countdown.isComplete ? (
            <Button
              onClick={() => countdown.start()}
              size="lg"
              className="retro-bevel"
            >
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          ) : countdown.isComplete ? (
            <Button
              onClick={countdown.reset}
              size="lg"
              className="retro-bevel"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          ) : (
            <>
              {countdown.isPaused ? (
                <Button onClick={countdown.resume} size="lg" variant="outline">
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
              ) : (
                <Button onClick={countdown.pause} size="lg" variant="outline">
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              )}
              <Button
                onClick={countdown.reset}
                size="lg"
                variant="destructive"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
