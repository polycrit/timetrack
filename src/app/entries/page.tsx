import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { EntryList } from "@/components/entries/entry-list";
import { EntryFilters } from "@/components/entries/entry-filters";
import { EntryForm } from "@/components/entries/entry-form";
import { FilterSkeleton } from "@/components/ui/skeleton-cards";
import { endOfDay, startOfDay } from "date-fns";
import Link from "next/link";

interface SearchParams {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  tagId?: string;
  page?: string;
}

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (params.startDate || params.endDate) {
    where.startTime = {
      ...(params.startDate && { gte: startOfDay(new Date(params.startDate)) }),
      ...(params.endDate && { lte: endOfDay(new Date(params.endDate)) }),
    };
  }
  if (params.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      include: { children: { select: { id: true } } },
    });
    if (project?.children?.length) {
      where.projectId = { in: [project.id, ...project.children.map((c) => c.id)] };
    } else {
      where.projectId = params.projectId;
    }
  }
  if (params.tagId) where.tags = { some: { tagId: params.tagId } };

  const [entries, total, projects, tags] = await Promise.all([
    prisma.timeEntry.findMany({
      where,
      include: {
        project: { include: { parent: { select: { name: true } } } },
        tags: { include: { tag: true } },
      },
      orderBy: { startTime: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.timeEntry.count({ where }),
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // Serialize dates for client components
  const serializedEntries = entries.map((e) => ({
    ...e,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-pixel text-base md:text-lg tracking-tight text-accent">Time Entries</h1>
        <EntryForm projects={projects} tags={tags} />
      </div>
      <Suspense fallback={<FilterSkeleton />}>
        <EntryFilters projects={projects} tags={tags} />
      </Suspense>
      <EntryList
        entries={serializedEntries}
        projects={projects}
        tags={tags}
      />
      {totalPages > 1 && (() => {
        const buildPageUrl = (p: number) => {
          const qs = new URLSearchParams();
          if (params.startDate) qs.set("startDate", params.startDate);
          if (params.endDate) qs.set("endDate", params.endDate);
          if (params.projectId) qs.set("projectId", params.projectId);
          if (params.tagId) qs.set("tagId", params.tagId);
          qs.set("page", String(p));
          return `/entries?${qs.toString()}`;
        };
        return (
          <div className="flex items-center justify-center gap-4">
            {page > 1 ? (
              <Link
                href={buildPageUrl(page - 1)}
                className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium rubber-link hover:bg-secondary/60 transition-all duration-75"
              >
                Previous
              </Link>
            ) : (
              <span className="inline-flex items-center rounded-md border border-border bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground opacity-50">
                Previous
              </span>
            )}
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            {page < totalPages ? (
              <Link
                href={buildPageUrl(page + 1)}
                className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium rubber-link hover:bg-secondary/60 transition-all duration-75"
              >
                Next
              </Link>
            ) : (
              <span className="inline-flex items-center rounded-md border border-border bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground opacity-50">
                Next
              </span>
            )}
          </div>
        );
      })()}
    </div>
  );
}
