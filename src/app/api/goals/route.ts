import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createGoalSchema } from "@/lib/validators";

export async function GET() {
  const goals = await prisma.goal.findMany({
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const goal = await prisma.goal.create({
    data: {
      type: parsed.data.type,
      targetMinutes: parsed.data.targetMinutes,
      projectId: parsed.data.projectId || null,
    },
  });
  return NextResponse.json(goal, { status: 201 });
}
