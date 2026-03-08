"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number; // 0→1 fraction elapsed
  isRunning: boolean;
  isPaused: boolean;
  isComplete?: boolean;
  colorClass?: string;
  size?: number;
  strokeWidth?: number;
  children: React.ReactNode;
}

export function ProgressRing({
  progress,
  isRunning,
  isPaused,
  isComplete = false,
  colorClass,
  size = 180,
  strokeWidth = 6,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * progress;

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

  const defaultColor = isComplete
    ? "text-[#FF8C42] animate-glow-pulse"
    : isPaused
      ? "text-[#A89070]"
      : isRunning
        ? "text-[#FF8C42]"
        : "text-[#FF8C42]/50";

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
          className="text-[#3D322C]"
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
            "transition-[stroke-dashoffset] duration-1000 ease-linear ring-glow",
            colorClass || defaultColor
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
