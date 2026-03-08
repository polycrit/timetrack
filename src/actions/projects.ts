"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createProjectSchema } from "@/lib/validators";

export async function createProject(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    color: formData.get("color") as string,
  };
  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  await prisma.project.create({ data: parsed.data });
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function updateProject(id: string, formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    color: formData.get("color") as string,
  };
  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  await prisma.project.update({ where: { id }, data: parsed.data });
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidatePath("/projects");
  revalidatePath("/");
}
