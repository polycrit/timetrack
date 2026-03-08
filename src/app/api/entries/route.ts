import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTimeEntrySchema, entryFilterSchema } from "@/lib/validators";
import { calculateDuration } from "@/lib/utils";
import { recalculateDailyLog } from "@/actions/daily-log";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());
  const parsed = entryFilterSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { startDate, endDate, projectId, tagId, page, pageSize } = parsed.data;

  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.startTime = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };
  }
  if (projectId) where.projectId = projectId;
  if (tagId) where.tags = { some: { tagId } };

  const [entries, total] = await Promise.all([
    prisma.timeEntry.findMany({
      where,
      include: {
        project: true,
        tags: { include: { tag: true } },
      },
      orderBy: { startTime: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.timeEntry.count({ where }),
  ]);

  return NextResponse.json({
    entries,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createTimeEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const duration = calculateDuration(parsed.data.startTime, parsed.data.endTime);

  const entry = await prisma.timeEntry.create({
    data: {
      description: parsed.data.description ?? "",
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      duration,
      projectId: parsed.data.projectId || null,
      tags: {
        create: (parsed.data.tagIds ?? []).map((tagId) => ({ tagId })),
      },
    },
    include: {
      project: true,
      tags: { include: { tag: true } },
    },
  });

  // Update daily log
  await recalculateDailyLog(parsed.data.startTime);

  return NextResponse.json(entry, { status: 201 });
}
