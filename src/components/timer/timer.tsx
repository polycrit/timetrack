"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTimer } from "@/lib/hooks/use-timer";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { usePomodoroSettings } from "@/lib/hooks/use-pomodoro-settings";
import { formatCountdownDisplay } from "@/lib/utils";
import { TimerDisplay } from "./timer-display";
import { ProgressRing } from "./progress-ring";
import { PomodoroSettingsDialog } from "./pomodoro-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Square, SkipForward, RotateCcw } from "lucide-react";

type ActiveTab = "free" | "pomodoro" | "countdown";

const COUNTDOWN_PRESETS = [
  { label: "5m", seconds: 5 * 60 },
  { label: "10m", seconds: 10 * 60 },
  { label: "15m", seconds: 15 * 60 },
  { label: "25m", seconds: 25 * 60 },
  { label: "45m", seconds: 45 * 60 },
  { label: "60m", seconds: 60 * 60 },
];

interface Project {
  id: string;
  name: string;
  color: string;
}

export function Timer({ projects: initialProjects }: { projects: Project[] }) {
  const router = useRouter();
  const { settings, updateSettings } = usePomodoroSettings();
  const timer = useTimer(settings);
  const countdown = useCountdown();

  const [activeTab, setActiveTab] = useState<ActiveTab>("free");
  const [hydrated, setHydrated] = useState(false);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [localDescription, setLocalDescription] = useState("");
  const [localProjectId, setLocalProjectId] = useState<string>("");
  const [countdownDescription, setCountdownDescription] = useState("");
  const [countdownProjectId, setCountdownProjectId] = useState<string>("");
  const [customMinutes, setCustomMinutes] = useState("");

  const countdownTickRef = useRef<HTMLParagraphElement>(null);
  const prevCountdownSecondsRef = useRef(countdown.remainingSeconds);

  // Hydrate: sync active tab from persisted state
  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => {
    if (!hydrated) return;
    if (countdown.isRunning || countdown.isComplete) {
      setActiveTab("countdown");
    } else {
      setActiveTab(timer.mode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    setLocalDescription(timer.description);
    setLocalProjectId(timer.projectId ?? "");
  }, [timer.description, timer.projectId]);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  // Refresh dashboard when countdown completes (entry was saved)
  const prevCountdownCompleteRef = useRef(false);
  useEffect(() => {
    if (countdown.isComplete && !prevCountdownCompleteRef.current) {
      router.refresh();
    }
    prevCountdownCompleteRef.current = countdown.isComplete;
  }, [countdown.isComplete, router]);

  // Countdown digit tick animation
  useEffect(() => {
    if (
      countdown.isRunning &&
      !countdown.isPaused &&
      countdown.remainingSeconds !== prevCountdownSecondsRef.current
    ) {
      prevCountdownSecondsRef.current = countdown.remainingSeconds;
      const el = countdownTickRef.current;
      if (el) {
        el.classList.remove("animate-digit-tick");
        void el.getBoundingClientRect();
        el.classList.add("animate-digit-tick");
      }
    }
  }, [countdown.remainingSeconds, countdown.isRunning, countdown.isPaused]);

  function handleTabChange(value: string) {
    const tab = value as ActiveTab;
    setActiveTab(tab);
    if (tab === "free" || tab === "pomodoro") {
      timer.setMode(tab);
    }
  }

  function handleStart() {
    timer.start(localProjectId || null, localDescription);
  }

  async function handleStop() {
    const result = await timer.stop();
    if (result) {
      setLocalDescription("");
      setLocalProjectId("");
      router.refresh();
    }
  }

  function handleSkip() {
    timer.skipPhase();
    router.refresh();
  }

  function handleCountdownReset() {
    countdown.reset();
    setCountdownDescription("");
    setCountdownProjectId("");
  }

  function handleCustomSet() {
    const mins = parseInt(customMinutes, 10);
    if (mins > 0) {
      countdown.setDuration(mins * 60);
      setCustomMinutes("");
    }
  }

  const isBreak =
    timer.mode === "pomodoro" &&
    (timer.pomodoroPhase === "shortBreak" || timer.pomodoroPhase === "longBreak");

  const isCountdownMode = activeTab === "countdown";
  const isAnyRunning = timer.isRunning || countdown.isRunning || countdown.isComplete;

  // Countdown visuals (on dark LED display)
  const countdownTimeColor = countdown.isComplete
    ? "text-[#FF8C42] animate-glow-pulse led-glow"
    : countdown.isPaused
      ? "text-[#A89070] animate-pulse"
      : countdown.isRunning
        ? "text-[#FF8C42] led-glow"
        : "text-[#F5E6D0]/70";

  let countdownStatusText: string;
  if (countdown.isComplete) countdownStatusText = "// COMPLETE";
  else if (countdown.isPaused) countdownStatusText = "// PAUSED";
  else if (countdown.isRunning) countdownStatusText = "// COUNTING DOWN";
  else countdownStatusText = "// SET TIMER";

  const showCountdownPicker = !countdown.isRunning && !countdown.isComplete;
  const showInputs = isCountdownMode
    ? !countdown.isComplete
    : !isBreak;

  return (
    <Card className="retro-bevel animate-card-appear">
      <CardContent className="space-y-5 py-6">
        {/* Mode Toggle */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="free" disabled={isAnyRunning}>
                  Free
                </TabsTrigger>
                <TabsTrigger value="pomodoro" disabled={isAnyRunning}>
                  Pomodoro
                </TabsTrigger>
                <TabsTrigger value="countdown" disabled={isAnyRunning}>
                  Countdown
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {activeTab === "pomodoro" && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-1.5">
                <PomodoroSettingsDialog
                  settings={settings}
                  onUpdate={updateSettings}
                />
              </div>
            )}
          </div>
        </div>

        {/* Display area — LED panel */}
        <div className="min-h-[300px] flex flex-col items-center justify-center led-display p-6 mx-2 sm:mx-6">
          {isCountdownMode ? (
            <>
              {showCountdownPicker && (
                <div className="space-y-3 mb-4">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {COUNTDOWN_PRESETS.map((p) => (
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

              <ProgressRing
                progress={countdown.progress}
                isRunning={countdown.isRunning}
                isPaused={countdown.isPaused}
                isComplete={countdown.isComplete}
              >
                <p
                  ref={countdownTickRef}
                  className={`font-pixel text-2xl sm:text-3xl tabular-nums tracking-wider ${countdownTimeColor}`}
                >
                  {formatCountdownDisplay(countdown.remainingSeconds)}
                </p>
              </ProgressRing>

              <p className="mt-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[#A89070]">
                {countdownStatusText}
              </p>
            </>
          ) : (
            <TimerDisplay
              seconds={timer.elapsedSeconds}
              remainingSeconds={timer.remainingSeconds}
              targetSeconds={timer.pomodoroTargetSeconds}
              isRunning={timer.isRunning}
              isPaused={timer.isPaused}
              mode={timer.mode}
              pomodoroPhase={timer.pomodoroPhase}
              pomodoroCount={timer.pomodoroCount}
              cyclesBeforeLongBreak={settings.cyclesBeforeLongBreak}
            />
          )}
        </div>

        {/* Controls — directly under the timer display */}
        <div className="flex gap-3 justify-center">
          {isCountdownMode ? (
            <>
              {!countdown.isRunning && !countdown.isComplete ? (
                <Button
                  onClick={() => countdown.start(countdownProjectId || null, countdownDescription)}
                  size="lg"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </Button>
              ) : countdown.isComplete ? (
                <Button
                  onClick={handleCountdownReset}
                  size="lg"
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
                    onClick={handleCountdownReset}
                    size="lg"
                    variant="destructive"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              {!timer.isRunning ? (
                <Button onClick={handleStart} size="lg">
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </Button>
              ) : (
                <>
                  {timer.isPaused ? (
                    <Button onClick={timer.resume} size="lg" variant="outline">
                      <Play className="mr-2 h-4 w-4" />
                      Resume
                    </Button>
                  ) : (
                    <Button onClick={timer.pause} size="lg" variant="outline">
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                  )}
                  {timer.mode === "pomodoro" && (
                    <Button onClick={handleSkip} size="lg" variant="secondary">
                      <SkipForward className="mr-2 h-4 w-4" />
                      Skip
                    </Button>
                  )}
                  <Button onClick={handleStop} size="lg" variant="destructive">
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Description & Project */}
        {showInputs && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="What are you working on?"
              value={
                isCountdownMode
                  ? countdown.isRunning ? countdown.description : countdownDescription
                  : timer.isRunning ? timer.description : localDescription
              }
              onChange={(e) => {
                if (isCountdownMode) {
                  if (countdown.isRunning) {
                    countdown.setDescription(e.target.value);
                  } else {
                    setCountdownDescription(e.target.value);
                  }
                } else {
                  if (timer.isRunning) {
                    timer.setDescription(e.target.value);
                  } else {
                    setLocalDescription(e.target.value);
                  }
                }
              }}
              className="flex-1"
            />
            <Select
              value={
                isCountdownMode
                  ? countdown.isRunning ? (countdown.projectId ?? "") : countdownProjectId
                  : timer.isRunning ? (timer.projectId ?? "") : localProjectId
              }
              onValueChange={(val) => {
                const id = val === "none" ? "" : val;
                if (isCountdownMode) {
                  if (countdown.isRunning) {
                    countdown.setProjectId(id || null);
                  } else {
                    setCountdownProjectId(id);
                  }
                } else {
                  if (timer.isRunning) {
                    timer.setProjectId(id || null);
                  } else {
                    setLocalProjectId(id);
                  }
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-sm"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
