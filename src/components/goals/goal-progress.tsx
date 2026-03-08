import { prisma } from "@/lib/prisma";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration, getTodayRange, getThisWeekRange } from "@/lib/utils";
import { Target } from "lucide-react";

interface Goal {
  id: string;
  type: string;
  targetMinutes: number;
  projectId: string | null;
  project: { id: string; name: string; color: string } | null;
}

async function getGoalProgress(goal: Goal) {
  const range = goal.type === "daily" ? getTodayRange() : getThisWeekRange();
  const where: Record<string, unknown> = {
    startTime: { gte: range.start, lte: range.end },
  };
  if (goal.projectId) where.projectId = goal.projectId;

  const result = await prisma.timeEntry.aggregate({
    where,
    _sum: { duration: true },
  });
  return result._sum.duration ?? 0;
}

export async function GoalProgress({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) {
    return null;
  }

  const goalsWithProgress = await Promise.all(
    goals.map(async (goal) => {
      const current = await getGoalProgress(goal);
      return { ...goal, current };
    })
  );

  return (
    <Card className="retro-bevel card-hover animate-card-appear">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goalsWithProgress.map((goal) => {
          const targetSeconds = goal.targetMinutes * 60;
          const percent = Math.min(
            100,
            Math.round((goal.current / targetSeconds) * 100)
          );
          return (
            <div key={goal.id} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  {goal.type === "daily" ? "Daily" : "Weekly"}
                  {goal.project ? ` - ${goal.project.name}` : ""}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatDuration(goal.current)} / {formatDuration(targetSeconds)}
                </span>
              </div>
              <Progress value={percent} className="h-2.5 progress-glow" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
