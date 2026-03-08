import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createProjectSchema } from "@/lib/validators";
import { getRequiredUserApi } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const userIdOrRes = await getRequiredUserApi();
  if (userIdOrRes instanceof NextResponse) return userIdOrRes;
  const userId = userIdOrRes;

  const { searchParams } = new URL(request.url);
  const flat = searchParams.get("flat") === "true";

  if (flat) {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: { parent: { select: { id: true, name: true, color: true } } },
    });
    return NextResponse.json(projects);
  }

  const projects = await prisma.project.findMany({
    where: { parentId: null, userId },
    include: {
      children: { orderBy: { name: "asc" } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const userIdOrRes = await getRequiredUserApi();
  if (userIdOrRes instanceof NextResponse) return userIdOrRes;
  const userId = userIdOrRes;

  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (parsed.data.parentId) {
    const parent = await prisma.project.findUnique({
      where: { id: parsed.data.parentId },
      select: { parentId: true, userId: true },
    });
    if (!parent || parent.userId !== userId) {
      return NextResponse.json(
        { error: { parentId: ["Parent project not found"] } },
        { status: 400 }
      );
    }
    if (parent.parentId) {
      return NextResponse.json(
        { error: { parentId: ["Cannot nest more than one level deep"] } },
        { status: 400 }
      );
    }
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      color: parsed.data.color,
      parentId: parsed.data.parentId ?? null,
      userId,
    },
  });
  return NextResponse.json(project, { status: 201 });
}
