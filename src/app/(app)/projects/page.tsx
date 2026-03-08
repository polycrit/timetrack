import { prisma } from "@/lib/prisma";
import { ProjectList } from "@/components/projects/project-list";
import { getRequiredUser } from "@/lib/auth-utils";

export default async function ProjectsPage() {
  const userId = await getRequiredUser();

  const projects = await prisma.project.findMany({
    where: { parentId: null, userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { timeEntries: true } },
      children: {
        orderBy: { name: "asc" },
        include: { _count: { select: { timeEntries: true } } },
      },
    },
  });

  // Fetch total duration per project
  const allProjectIds = projects.flatMap((p) => [
    p.id,
    ...p.children.map((c) => c.id),
  ]);

  const durationStats = await prisma.timeEntry.groupBy({
    by: ["projectId"],
    where: { projectId: { in: allProjectIds }, userId },
    _sum: { duration: true },
  });

  const durationMap = new Map(
    durationStats.map((s) => [s.projectId, s._sum.duration ?? 0])
  );

  const projectsWithStats = projects.map((p) => ({
    ...p,
    totalDuration: durationMap.get(p.id) ?? 0,
    children: p.children.map((c) => ({
      ...c,
      totalDuration: durationMap.get(c.id) ?? 0,
    })),
  }));

  const parentProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
  }));

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-pixel text-base md:text-lg tracking-tight text-accent">Projects</h1>
      <ProjectList projects={projectsWithStats} parentProjects={parentProjects} />
    </div>
  );
}
