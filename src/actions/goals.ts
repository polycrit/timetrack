"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createGoalSchema } from "@/lib/validators";

export async function createGoal(formData: FormData) {
  const raw = {
    type: formData.get("type") as string,
    targetMinutes: parseInt(formData.get("targetMinutes") as string, 10),
    projectId: (formData.get("projectId") as string) || null,
  };
  const parsed = createGoalSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  await prisma.goal.create({
    data: {
      type: parsed.data.type,
      targetMinutes: parsed.data.targetMinutes,
      projectId: parsed.data.projectId || null,
    },
  });
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function deleteGoal(id: string) {
  await prisma.goal.delete({ where: { id } });
  revalidatePath("/settings");
  revalidatePath("/");
}
