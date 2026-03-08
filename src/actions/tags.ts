"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTagSchema } from "@/lib/validators";

export async function createTag(formData: FormData) {
  const raw = { name: formData.get("name") as string };
  const parsed = createTagSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  await prisma.tag.create({ data: parsed.data });
  revalidatePath("/settings");
}

export async function updateTag(id: string, formData: FormData) {
  const raw = { name: formData.get("name") as string };
  const parsed = createTagSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  await prisma.tag.update({ where: { id }, data: parsed.data });
  revalidatePath("/settings");
}

export async function deleteTag(id: string) {
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/settings");
}
