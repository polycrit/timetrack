import { prisma } from "@/lib/prisma";
import { TagManager } from "@/components/settings/tag-manager";
import { GoalManager } from "@/components/settings/goal-manager";
import { getRequiredUser } from "@/lib/auth-utils";

export default async function SettingsPage() {
  const userId = await getRequiredUser();

  const [tags, goals, projects] = await Promise.all([
    prisma.tag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.goal.findMany({
      where: { userId },
      include: { project: { include: { parent: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-pixel text-base md:text-lg tracking-tight text-accent">Settings</h1>
      <TagManager tags={tags} />
      <GoalManager goals={goals} projects={projects} />
    </div>
  );
}
