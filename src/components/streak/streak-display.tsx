import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface StreakDisplayProps {
  currentStreak: number;
  bestStreak: number;
}

export function StreakDisplay({ currentStreak, bestStreak }: StreakDisplayProps) {
  return (
    <Card className="retro-bevel card-hover animate-card-appear">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-4 w-4 text-accent animate-flame" />
          Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="font-pixel text-xl text-accent">{currentStreak}</span>
          <span className="text-muted-foreground text-sm">
            {currentStreak === 1 ? "day" : "days"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Best: <span className="font-mono font-medium text-foreground/70">{bestStreak}</span> {bestStreak === 1 ? "day" : "days"}
        </p>
      </CardContent>
    </Card>
  );
}
