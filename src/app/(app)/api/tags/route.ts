import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTagSchema } from "@/lib/validators";
import { getRequiredUserApi } from "@/lib/auth-utils";

export async function GET() {
  const userIdOrRes = await getRequiredUserApi();
  if (userIdOrRes instanceof NextResponse) return userIdOrRes;
  const userId = userIdOrRes;

  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(tags);
}

export async function POST(request: NextRequest) {
  const userIdOrRes = await getRequiredUserApi();
  if (userIdOrRes instanceof NextResponse) return userIdOrRes;
  const userId = userIdOrRes;

  const body = await request.json();
  const parsed = createTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const tag = await prisma.tag.create({ data: { ...parsed.data, userId } });
  return NextResponse.json(tag, { status: 201 });
}
