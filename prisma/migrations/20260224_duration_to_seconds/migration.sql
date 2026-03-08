-- Convert TimeEntry.duration from minutes to seconds
UPDATE "TimeEntry" SET "duration" = "duration" * 60;

-- Rename DailyLog.totalMinutes to totalSeconds and convert values
ALTER TABLE "DailyLog" RENAME COLUMN "totalMinutes" TO "totalSeconds";
UPDATE "DailyLog" SET "totalSeconds" = "totalSeconds" * 60;
