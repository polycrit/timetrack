import { prisma } from "@/lib/prisma";
import { ProjectList } from "@/components/projects/project-list";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { timeEntries: true } } },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-pixel text-base md:text-lg tracking-tight text-accent">Projects</h1>
      <ProjectList projects={projects} />
    </div>
  );
}
