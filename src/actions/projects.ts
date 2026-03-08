"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createProjectSchema } from "@/lib/validators";
import { getRequiredUser } from "@/lib/auth-utils";

export async function createProject(formData: FormData) {
  const userId = await getRequiredUser();
  const raw = {
    name: formData.get("name") as string,
    color: formData.get("color") as string,
    parentId: (formData.get("parentId") as string) || null,
  };
  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.parentId) {
    const parent = await prisma.project.findUnique({
      where: { id: parsed.data.parentId },
      select: { parentId: true, userId: true },
    });
    if (!parent || parent.userId !== userId)
      return { error: { parentId: ["Parent project not found"] } };
    if (parent.parentId)
      return { error: { parentId: ["Cannot nest more than one level deep"] } };
  }

  await prisma.project.create({
    data: {
      name: parsed.data.name,
      color: parsed.data.color,
      parentId: parsed.data.parentId ?? null,
      userId,
    },
  });
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function updateProject(id: string, formData: FormData) {
  const userId = await getRequiredUser();
  const raw = {
    name: formData.get("name") as string,
    color: formData.get("color") as string,
    parentId: (formData.get("parentId") as string) || null,
  };
  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.parentId) {
    if (parsed.data.parentId === id) {
      return { error: { parentId: ["A project cannot be its own parent"] } };
    }
    const parent = await prisma.project.findUnique({
      where: { id: parsed.data.parentId },
      select: { parentId: true, userId: true },
    });
    if (!parent || parent.userId !== userId)
      return { error: { parentId: ["Parent project not found"] } };
    if (parent.parentId)
      return { error: { parentId: ["Cannot nest more than one level deep"] } };
  }

  await prisma.project.updateMany({
    where: { id, userId },
    data: {
      name: parsed.data.name,
      color: parsed.data.color,
      parentId: parsed.data.parentId ?? null,
    },
  });
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function deleteProject(id: string) {
  const userId = await getRequiredUser();
  await prisma.project.deleteMany({ where: { id, userId } });
  revalidatePath("/projects");
  revalidatePath("/");
}
