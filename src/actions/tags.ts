"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTagSchema } from "@/lib/validators";
import { getRequiredUser } from "@/lib/auth-utils";

export async function createTag(formData: FormData) {
  const userId = await getRequiredUser();
  const raw = { name: formData.get("name") as string };
  const parsed = createTagSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  await prisma.tag.create({ data: { ...parsed.data, userId } });
  revalidatePath("/settings");
}

export async function updateTag(id: string, formData: FormData) {
  const userId = await getRequiredUser();
  const raw = { name: formData.get("name") as string };
  const parsed = createTagSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  await prisma.tag.updateMany({ where: { id, userId }, data: parsed.data });
  revalidatePath("/settings");
}

export async function deleteTag(id: string) {
  const userId = await getRequiredUser();
  await prisma.tag.deleteMany({ where: { id, userId } });
  revalidatePath("/settings");
}
