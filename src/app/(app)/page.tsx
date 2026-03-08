import { prisma } from "@/lib/prisma";
import { Timer } from "@/components/timer/timer";
import { GoalProgress } from "@/components/goals/goal-progress";
import { StreakDisplay } from "@/components/streak/streak-display";
import { getStreakData } from "@/actions/daily-log";
import { getTodayRange, formatDuration, formatTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { getRequiredUser } from "@/lib/auth-utils";

export default async function DashboardPage() {
  const userId = await getRequiredUser();
  const { start, end } = getTodayRange();

  const [todayEntries, goals, streakData, projects] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { userId, startTime: { gte: start, lte: end } },
      include: { project: { include: { parent: { select: { name: true } } } } },
      orderBy: { startTime: "desc" },
      take: 5,
    }),
    prisma.goal.findMany({ where: { userId }, include: { project: { include: { parent: { select: { name: true } } } } } }),
    getStreakData(userId),
    prisma.project.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  const todayTotal = todayEntries.reduce((sum, e) => sum + e.duration, 0);

  return (
    <div className="space-y-6">
      <h1 className="font-pixel text-base md:text-lg tracking-tight text-accent">Dashboard</h1>

      {/* Timer */}
      <Timer projects={projects} />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Summary */}
        <Card className="retro-bevel card-hover animate-card-appear">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-pixel text-xl text-primary">{formatDuration(todayTotal)}</p>
            <p className="text-sm text-muted-foreground">
              {todayEntries.length} {todayEntries.length === 1 ? "entry" : "entries"}
            </p>
          </CardContent>
        </Card>

        {/* Streak */}
        <StreakDisplay
          currentStreak={streakData.currentStreak}
          bestStreak={streakData.bestStreak}
        />

        {/* Goals */}
        <GoalProgress goals={goals} />
      </div>

      {/* Recent Entries */}
      {todayEntries.length > 0 && (
        <Card className="retro-bevel card-hover animate-card-appear">
          <CardHeader>
            <CardTitle className="text-base">Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-sm">
                      {entry.description || "Untitled"}
                    </span>
                    {entry.project && (
                      <Badge
                        variant="secondary"
                        className="shrink-0"
                        style={{
                          backgroundColor: entry.project.color + "20",
                          color: entry.project.color,
                        }}
                      >
                        {entry.project.parent ? `${entry.project.parent.name} > ` : ""}
                        {entry.project.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-2 shrink-0">
                    <span className="text-sm text-muted-foreground">
                      {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                    </span>
                    <span className="font-mono text-sm font-medium">
                      {formatDuration(entry.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
