"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, differenceInCalendarDays } from "date-fns";

export async function recalculateDailyLog(date: Date, userId: string) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const result = await prisma.timeEntry.aggregate({
    where: {
      userId,
      startTime: { gte: dayStart, lte: dayEnd },
    },
    _sum: { duration: true },
  });

  const totalSeconds = result._sum.duration ?? 0;

  await prisma.dailyLog.upsert({
    where: { date_userId: { date: dayStart, userId } },
    update: {
      totalSeconds,
      streakDay: totalSeconds > 0,
    },
    create: {
      date: dayStart,
      totalSeconds,
      streakDay: totalSeconds > 0,
      userId,
    },
  });
}

export async function getStreakData(userId: string) {
  const logs = await prisma.dailyLog.findMany({
    where: { userId, streakDay: true },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (logs.length === 0) return { currentStreak: 0, bestStreak: 0 };

  let currentStreak = 0;
  const today = startOfDay(new Date());
  let checkDate = today;

  for (const log of logs) {
    const logDate = startOfDay(log.date);
    const diff = differenceInCalendarDays(checkDate, logDate);
    if (diff === 0) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    } else if (diff > 0) {
      if (currentStreak === 0 && differenceInCalendarDays(today, logDate) === 1) {
        currentStreak++;
        checkDate = subDays(logDate, 1);
      } else {
        break;
      }
    }
  }

  let bestStreak = 0;
  let streak = 1;
  for (let i = 1; i < logs.length; i++) {
    const diff = differenceInCalendarDays(logs[i - 1].date, logs[i].date);
    if (diff === 1) {
      streak++;
    } else {
      bestStreak = Math.max(bestStreak, streak);
      streak = 1;
    }
  }
  bestStreak = Math.max(bestStreak, streak, currentStreak);

  return { currentStreak, bestStreak };
}
