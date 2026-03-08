import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTimeEntrySchema } from "@/lib/validators";
import { calculateDuration } from "@/lib/utils";
import { recalculateDailyLog } from "@/actions/daily-log";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateTimeEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.timeEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const startTime = parsed.data.startTime ?? existing.startTime;
  const endTime = parsed.data.endTime ?? existing.endTime;
  const duration = calculateDuration(startTime, endTime);

  // Delete existing tag connections if tagIds provided
  if (parsed.data.tagIds) {
    await prisma.timeEntryTag.deleteMany({ where: { timeEntryId: id } });
  }

  const entry = await prisma.timeEntry.update({
    where: { id },
    data: {
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.startTime && { startTime: parsed.data.startTime }),
      ...(parsed.data.endTime && { endTime: parsed.data.endTime }),
      duration,
      ...(parsed.data.projectId !== undefined && { projectId: parsed.data.projectId || null }),
      ...(parsed.data.tagIds && {
        tags: {
          create: parsed.data.tagIds.map((tagId) => ({ tagId })),
        },
      }),
    },
    include: {
      project: true,
      tags: { include: { tag: true } },
    },
  });

  // Recalculate daily logs for affected dates
  await recalculateDailyLog(existing.startTime);
  if (startTime.getTime() !== existing.startTime.getTime()) {
    await recalculateDailyLog(startTime);
  }

  return NextResponse.json(entry);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const entry = await prisma.timeEntry.findUnique({ where: { id } });
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.timeEntry.delete({ where: { id } });
  await recalculateDailyLog(entry.startTime);

  return NextResponse.json({ success: true });
}
