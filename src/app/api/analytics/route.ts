import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  startOfDay,
  endOfDay,
  subDays,
  subWeeks,
  subMonths,
  format,
  eachDayOfInterval,
  getDay,
} from "date-fns";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "weekly";

  const now = new Date();
  let rangeStart: Date;
  if (period === "daily") {
    rangeStart = subDays(startOfDay(now), 6); // last 7 days
  } else if (period === "monthly") {
    rangeStart = subMonths(startOfDay(now), 1);
  } else {
    rangeStart = subWeeks(startOfDay(now), 1); // last 7 days
  }
  const rangeEnd = endOfDay(now);

  // Daily breakdown from DailyLog
  const dailyLogs = await prisma.dailyLog.findMany({
    where: { date: { gte: rangeStart, lte: rangeEnd } },
    orderBy: { date: "asc" },
  });

  // Fill in missing days with 0
  const allDays = eachDayOfInterval({ start: rangeStart, end: startOfDay(now) });
  const logMap = new Map(
    dailyLogs.map((l) => [format(l.date, "yyyy-MM-dd"), l.totalSeconds])
  );
  const dailyBreakdown = allDays.map((d) => ({
    date: format(d, "MMM d"),
    totalSeconds: logMap.get(format(d, "yyyy-MM-dd")) ?? 0,
    hours: parseFloat(((logMap.get(format(d, "yyyy-MM-dd")) ?? 0) / 3600).toFixed(1)),
  }));

  // Project breakdown
  const entries = await prisma.timeEntry.findMany({
    where: { startTime: { gte: rangeStart, lte: rangeEnd } },
    select: { duration: true, projectId: true },
  });

  const projectMap = new Map<string | null, number>();
  for (const e of entries) {
    const key = e.projectId;
    projectMap.set(key, (projectMap.get(key) ?? 0) + e.duration);
  }

  const projects = await prisma.project.findMany();
  const projectLookup = new Map(projects.map((p) => [p.id, p]));

  const projectBreakdown = Array.from(projectMap.entries()).map(
    ([projectId, totalSeconds]) => ({
      projectId,
      projectName: projectId ? projectLookup.get(projectId)?.name ?? "Unknown" : "Uncategorized",
      color: projectId ? projectLookup.get(projectId)?.color ?? "#94A3B8" : "#94A3B8",
      totalSeconds,
      hours: parseFloat((totalSeconds / 3600).toFixed(1)),
    })
  );

  // Summary stats
  const totalSeconds = entries.reduce((sum, e) => sum + e.duration, 0);
  const daysInRange = allDays.length;
  const avgSecondsPerDay = daysInRange > 0 ? Math.round(totalSeconds / daysInRange) : 0;

  // Most productive day of week
  const dayOfWeekMinutes: number[] = [0, 0, 0, 0, 0, 0, 0];
  const dayOfWeekCount: number[] = [0, 0, 0, 0, 0, 0, 0];
  for (const d of allDays) {
    const dayIdx = getDay(d);
    const secs = logMap.get(format(d, "yyyy-MM-dd")) ?? 0;
    dayOfWeekMinutes[dayIdx] += secs;
    dayOfWeekCount[dayIdx]++;
  }
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let bestDayIdx = 0;
  let bestDayAvg = 0;
  for (let i = 0; i < 7; i++) {
    const avg = dayOfWeekCount[i] > 0 ? dayOfWeekMinutes[i] / dayOfWeekCount[i] : 0;
    if (avg > bestDayAvg) {
      bestDayAvg = avg;
      bestDayIdx = i;
    }
  }

  return NextResponse.json({
    dailyBreakdown,
    projectBreakdown,
    summary: {
      totalSeconds,
      totalHours: parseFloat((totalSeconds / 3600).toFixed(1)),
      avgSecondsPerDay,
      avgHoursPerDay: parseFloat((avgSecondsPerDay / 3600).toFixed(1)),
      mostProductiveDay: totalSeconds > 0 ? dayNames[bestDayIdx] : "N/A",
      totalEntries: entries.length,
    },
  });
}
