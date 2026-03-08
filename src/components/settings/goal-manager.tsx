"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalForm } from "@/components/goals/goal-form";
import { deleteGoal } from "@/actions/goals";
import { formatDuration } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface Goal {
  id: string;
  type: string;
  targetMinutes: number;
  projectId: string | null;
  project: { id: string; name: string; color: string; parent?: { name: string } | null } | null;
}

interface Project {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
}

export function GoalManager({
  goals,
  projects,
}: {
  goals: Goal[];
  projects: Project[];
}) {
  return (
    <Card className="retro-bevel">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Goals</CardTitle>
        <GoalForm projects={projects} />
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No goals set. Add one to track your progress.
          </p>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">
                    {goal.type === "daily" ? "Daily" : "Weekly"} -{" "}
                    {formatDuration(goal.targetMinutes * 60)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {goal.project
                      ? `${goal.project.parent ? `${goal.project.parent.name} > ` : ""}${goal.project.name}`
                      : "All projects"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteGoal(goal.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
