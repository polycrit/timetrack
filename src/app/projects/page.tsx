import { prisma } from "@/lib/prisma";
import { ProjectList } from "@/components/projects/project-list";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { parentId: null },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { timeEntries: true } },
      children: {
        orderBy: { name: "asc" },
        include: { _count: { select: { timeEntries: true } } },
      },
    },
  });

  // Top-level projects for the parent selector in the form
  const parentProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
  }));

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-pixel text-base md:text-lg tracking-tight text-accent">Projects</h1>
      <ProjectList projects={projects} parentProjects={parentProjects} />
    </div>
  );
}
