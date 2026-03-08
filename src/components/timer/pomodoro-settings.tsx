"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings2 } from "lucide-react";
import type { PomodoroSettings } from "@/lib/hooks/use-pomodoro-settings";

interface PomodoroSettingsDialogProps {
  settings: PomodoroSettings;
  onUpdate: (updates: Partial<PomodoroSettings>) => void;
}

export function PomodoroSettingsDialog({
  settings,
  onUpdate,
}: PomodoroSettingsDialogProps) {
  function requestNotifications() {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        onUpdate({ notificationsEnabled: permission === "granted" });
      });
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pomodoro Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="work" className="text-xs">Work (min)</Label>
              <Input
                id="work"
                type="number"
                min={1}
                max={120}
                value={settings.workMinutes}
                onChange={(e) =>
                  onUpdate({ workMinutes: parseInt(e.target.value) || 25 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shortBreak" className="text-xs">Short Break</Label>
              <Input
                id="shortBreak"
                type="number"
                min={1}
                max={30}
                value={settings.shortBreakMinutes}
                onChange={(e) =>
                  onUpdate({ shortBreakMinutes: parseInt(e.target.value) || 5 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="longBreak" className="text-xs">Long Break</Label>
              <Input
                id="longBreak"
                type="number"
                min={1}
                max={60}
                value={settings.longBreakMinutes}
                onChange={(e) =>
                  onUpdate({ longBreakMinutes: parseInt(e.target.value) || 15 })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cycles" className="text-xs">Cycles before long break</Label>
            <Input
              id="cycles"
              type="number"
              min={2}
              max={10}
              value={settings.cyclesBeforeLongBreak}
              onChange={(e) =>
                onUpdate({ cyclesBeforeLongBreak: parseInt(e.target.value) || 4 })
              }
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoStartBreaks}
                onChange={(e) => onUpdate({ autoStartBreaks: e.target.checked })}
                className="rounded"
              />
              Auto-start breaks
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoStartWork}
                onChange={(e) => onUpdate({ autoStartWork: e.target.checked })}
                className="rounded"
              />
              Auto-start work sessions
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => {
                  if (e.target.checked) {
                    requestNotifications();
                  } else {
                    onUpdate({ notificationsEnabled: false });
                  }
                }}
                className="rounded"
              />
              Browser notifications
            </label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
