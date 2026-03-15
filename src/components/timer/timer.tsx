"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTimerStore } from "@/lib/stores/timer-store";
import { useHydrateStore, useTimerTick, useCountdownTick } from "@/lib/hooks/use-timer-tick";
import { formatCountdownDisplay } from "@/lib/utils";
import { TimerDisplay } from "./timer-display";
import { ProgressRing } from "./progress-ring";
import { PomodoroSettingsDialog } from "./pomodoro-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectSelect } from "@/components/projects/project-select";
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
  parentId: string | null;
}

export function Timer({ projects: initialProjects }: { projects: Project[] }) {
  const router = useRouter();
  const hydrated = useHydrateStore();
  useTimerTick();
  useCountdownTick();

  // --- Timer selectors ---
  const timerIsRunning = useTimerStore((s) => s.timer.isRunning);
  const timerIsPaused = useTimerStore((s) => s.timer.isPaused);
  const timerMode = useTimerStore((s) => s.timer.mode);
  const timerDescription = useTimerStore((s) => s.timer.description);
  const timerProjectId = useTimerStore((s) => s.timer.projectId);
  const timerPomodoroPhase = useTimerStore((s) => s.timer.pomodoroPhase);
  const timerPomodoroCount = useTimerStore((s) => s.timer.pomodoroCount);
  const timerPomodoroTargetSeconds = useTimerStore((s) => s.timer.pomodoroTargetSeconds);
  const timerElapsed = useTimerStore((s) => s.timerElapsed);

  // --- Countdown selectors ---
  const cdIsRunning = useTimerStore((s) => s.countdown.isRunning);
  const cdIsPaused = useTimerStore((s) => s.countdown.isPaused);
  const cdIsComplete = useTimerStore((s) => s.countdown.isComplete);
  const cdTargetSeconds = useTimerStore((s) => s.countdown.targetSeconds);
  const cdDescription = useTimerStore((s) => s.countdown.description);
  const cdProjectId = useTimerStore((s) => s.countdown.projectId);
  const cdElapsed = useTimerStore((s) => s.countdownElapsed);

  // --- Settings ---
  const pomodoroSettings = useTimerStore((s) => s.pomodoroSettings);

  // --- Actions ---
  const timerStart = useTimerStore((s) => s.timerStart);
  const timerPause = useTimerStore((s) => s.timerPause);
  const timerResume = useTimerStore((s) => s.timerResume);
  const timerStop = useTimerStore((s) => s.timerStop);
  const timerSetDescription = useTimerStore((s) => s.timerSetDescription);
  const timerSetProjectId = useTimerStore((s) => s.timerSetProjectId);
  const timerSetMode = useTimerStore((s) => s.timerSetMode);
  const timerSkipPhase = useTimerStore((s) => s.timerSkipPhase);

  const countdownStart = useTimerStore((s) => s.countdownStart);
  const countdownPause = useTimerStore((s) => s.countdownPause);
  const countdownResume = useTimerStore((s) => s.countdownResume);
  const countdownReset = useTimerStore((s) => s.countdownReset);
  const countdownSetDuration = useTimerStore((s) => s.countdownSetDuration);
  const countdownSetDescription = useTimerStore((s) => s.countdownSetDescription);
  const countdownSetProjectId = useTimerStore((s) => s.countdownSetProjectId);

  const updatePomodoroSettings = useTimerStore((s) => s.updatePomodoroSettings);

  // --- Local UI state ---
  const [activeTab, setActiveTab] = useState<ActiveTab>("free");
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [localDescription, setLocalDescription] = useState("");
  const [localProjectId, setLocalProjectId] = useState<string>("");
  const [localCdDescription, setLocalCdDescription] = useState("");
  const [localCdProjectId, setLocalCdProjectId] = useState<string>("");
  const [customMinutes, setCustomMinutes] = useState("");

  const countdownTickRef = useRef<HTMLParagraphElement>(null);

  // Derived
  const cdRemainingSeconds = (cdIsRunning || cdIsComplete)
    ? Math.max(0, cdTargetSeconds - cdElapsed)
    : cdTargetSeconds;
  const cdProgress = cdTargetSeconds > 0 ? Math.min(1, cdElapsed / cdTargetSeconds) : 0;
  const timerRemainingSeconds = timerMode === "pomodoro"
    ? Math.max(0, timerPomodoroTargetSeconds - timerElapsed)
    : 0;

  const prevCdSecondsRef = useRef(cdRemainingSeconds);

  // Sync active tab from persisted state on hydration
  useEffect(() => {
    if (!hydrated) return;
    if (cdIsRunning || cdIsComplete) {
      setActiveTab("countdown");
    } else {
      setActiveTab(timerMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Sync local description/project from persisted timer state
  useEffect(() => {
    setLocalDescription(timerDescription);
    setLocalProjectId(timerProjectId ?? "");
  }, [timerDescription, timerProjectId]);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  // Refresh dashboard when countdown completes
  const prevCdCompleteRef = useRef(false);
  useEffect(() => {
    if (cdIsComplete && !prevCdCompleteRef.current) {
      router.refresh();
    }
    prevCdCompleteRef.current = cdIsComplete;
  }, [cdIsComplete, router]);

  // Countdown digit tick animation
  useEffect(() => {
    if (cdIsRunning && !cdIsPaused && cdRemainingSeconds !== prevCdSecondsRef.current) {
      prevCdSecondsRef.current = cdRemainingSeconds;
      const el = countdownTickRef.current;
      if (el) {
        el.classList.remove("animate-digit-tick");
        void el.getBoundingClientRect();
        el.classList.add("animate-digit-tick");
      }
    }
  }, [cdRemainingSeconds, cdIsRunning, cdIsPaused]);

  function handleTabChange(value: string) {
    const tab = value as ActiveTab;
    setActiveTab(tab);
    if (tab === "free" || tab === "pomodoro") {
      timerSetMode(tab);
    }
  }

  function handleStart() {
    timerStart(localProjectId || null, localDescription);
  }

  function handleStop() {
    const result = timerStop();
    if (result) {
      setLocalDescription("");
      setLocalProjectId("");
      router.refresh();
    }
  }

  function handleSkip() {
    timerSkipPhase();
    router.refresh();
  }

  function handleCountdownReset() {
    countdownReset();
    setLocalCdDescription("");
    setLocalCdProjectId("");
  }

  function handleCustomSet() {
    const mins = parseInt(customMinutes, 10);
    if (mins > 0) {
      countdownSetDuration(mins * 60);
      setCustomMinutes("");
    }
  }

  const isBreak =
    timerMode === "pomodoro" &&
    (timerPomodoroPhase === "shortBreak" || timerPomodoroPhase === "longBreak");

  const isCountdownMode = activeTab === "countdown";
  const isAnyRunning = timerIsRunning || cdIsRunning || cdIsComplete;

  // Countdown visuals
  const countdownTimeColor = cdIsComplete
    ? "text-[#FF8C42] animate-glow-pulse led-glow"
    : cdIsPaused
      ? "text-[#A89070] animate-pulse"
      : cdIsRunning
        ? "text-[#FF8C42] led-glow"
        : "text-[#F5E6D0]/70";

  let countdownStatusText: string;
  if (cdIsComplete) countdownStatusText = "// COMPLETE";
  else if (cdIsPaused) countdownStatusText = "// PAUSED";
  else if (cdIsRunning) countdownStatusText = "// COUNTING DOWN";
  else countdownStatusText = "// SET TIMER";

  const showCountdownPicker = !cdIsRunning && !cdIsComplete;
  const showInputs = isCountdownMode ? !cdIsComplete : !isBreak;

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
                  settings={pomodoroSettings}
                  onUpdate={updatePomodoroSettings}
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
                          cdTargetSeconds === p.seconds
                            ? "secondary"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => countdownSetDuration(p.seconds)}
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
                progress={cdProgress}
                isRunning={cdIsRunning}
                isPaused={cdIsPaused}
                isComplete={cdIsComplete}
              >
                <p
                  ref={countdownTickRef}
                  className={`font-pixel text-2xl sm:text-3xl tabular-nums tracking-wider ${countdownTimeColor}`}
                >
                  {formatCountdownDisplay(cdRemainingSeconds)}
                </p>
              </ProgressRing>

              <p className="mt-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[#A89070]">
                {countdownStatusText}
              </p>
            </>
          ) : (
            <TimerDisplay
              seconds={timerElapsed}
              remainingSeconds={timerRemainingSeconds}
              targetSeconds={timerPomodoroTargetSeconds}
              isRunning={timerIsRunning}
              isPaused={timerIsPaused}
              mode={timerMode}
              pomodoroPhase={timerPomodoroPhase}
              pomodoroCount={timerPomodoroCount}
              cyclesBeforeLongBreak={pomodoroSettings.cyclesBeforeLongBreak}
            />
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          {isCountdownMode ? (
            <>
              {!cdIsRunning && !cdIsComplete ? (
                <Button
                  onClick={() => countdownStart(localCdProjectId || null, localCdDescription)}
                  size="lg"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </Button>
              ) : cdIsComplete ? (
                <Button
                  onClick={handleCountdownReset}
                  size="lg"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              ) : (
                <>
                  {cdIsPaused ? (
                    <Button onClick={countdownResume} size="lg" variant="outline">
                      <Play className="mr-2 h-4 w-4" />
                      Resume
                    </Button>
                  ) : (
                    <Button onClick={countdownPause} size="lg" variant="outline">
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
              {!timerIsRunning ? (
                <Button onClick={handleStart} size="lg">
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </Button>
              ) : (
                <>
                  {timerIsPaused ? (
                    <Button onClick={timerResume} size="lg" variant="outline">
                      <Play className="mr-2 h-4 w-4" />
                      Resume
                    </Button>
                  ) : (
                    <Button onClick={timerPause} size="lg" variant="outline">
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                  )}
                  {timerMode === "pomodoro" && (
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
                  ? cdIsRunning ? cdDescription : localCdDescription
                  : timerIsRunning ? timerDescription : localDescription
              }
              onChange={(e) => {
                if (isCountdownMode) {
                  if (cdIsRunning) {
                    countdownSetDescription(e.target.value);
                  } else {
                    setLocalCdDescription(e.target.value);
                  }
                } else {
                  if (timerIsRunning) {
                    timerSetDescription(e.target.value);
                  } else {
                    setLocalDescription(e.target.value);
                  }
                }
              }}
              className="flex-1"
            />
            <ProjectSelect
              projects={projects}
              value={
                isCountdownMode
                  ? cdIsRunning ? (cdProjectId ?? "") : localCdProjectId
                  : timerIsRunning ? (timerProjectId ?? "") : localProjectId
              }
              onValueChange={(val) => {
                const id = val === "none" ? "" : val;
                if (isCountdownMode) {
                  if (cdIsRunning) {
                    countdownSetProjectId(id || null);
                  } else {
                    setLocalCdProjectId(id);
                  }
                } else {
                  if (timerIsRunning) {
                    timerSetProjectId(id || null);
                  } else {
                    setLocalProjectId(id);
                  }
                }
              }}
              showNone
              className="w-full sm:w-[180px]"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
