"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectForm } from "./project-form";
import { deleteProject } from "@/actions/projects";
import { formatDuration } from "@/lib/utils";
import { Pencil, Trash2, FolderKanban, Plus } from "lucide-react";

interface Project {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  _count: { timeEntries: number };
  totalDuration: number;
  children?: Project[];
}

function getTotalEntries(project: Project): number {
  const own = project._count.timeEntries;
  const childTotal = (project.children ?? []).reduce(
    (sum, c) => sum + c._count.timeEntries,
    0
  );
  return own + childTotal;
}

function getTotalDuration(project: Project): number {
  const own = project.totalDuration;
  const childTotal = (project.children ?? []).reduce(
    (sum, c) => sum + c.totalDuration,
    0
  );
  return own + childTotal;
}

export function ProjectList({ projects, parentProjects }: { projects: Project[]; parentProjects: { id: string; name: string; color: string }[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ProjectForm parentProjects={parentProjects} />
      </div>
      {projects.length === 0 ? (
        <Card className="retro-bevel">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderKanban className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No projects yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Create one to organize your time entries.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {projects.map((project, i) => {
            const totalEntries = getTotalEntries(project);
            const totalDuration = getTotalDuration(project);
            return (
              <div key={project.id}>
                <Card
                  className={`retro-bevel card-hover hover-actions animate-card-appear opacity-0 stagger-${Math.min(i + 1, 10)}`}
                >
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-sm"
                        style={{ backgroundColor: project.color }}
                      />
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {totalEntries} {totalEntries === 1 ? "entry" : "entries"}
                          <span className="mx-1.5">·</span>
                          <span className="font-mono">{formatDuration(totalDuration)}</span>
                          {project.children && project.children.length > 0 && (
                            <span className="ml-1.5 text-muted-foreground/60">
                              ({project.children.length} sub-projects)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="action-buttons flex gap-2">
                      <ProjectForm
                        defaultParentId={project.id}
                        defaultParentColor={project.color}
                        trigger={
                          <Button variant="ghost" size="icon" title="Add sub-project">
                            <Plus className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <ProjectForm
                        project={project}
                        parentProjects={parentProjects}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteProject(project.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                {/* Children */}
                {project.children && project.children.length > 0 && (
                  <div className="ml-6 mt-1 space-y-1">
                    {project.children.map((child) => (
                      <Card
                        key={child.id}
                        className="retro-bevel card-hover hover-actions border-l-2"
                        style={{ borderLeftColor: project.color }}
                      >
                        <CardContent className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-3 w-3 rounded-sm"
                              style={{ backgroundColor: child.color }}
                            />
                            <div>
                              <p className="text-sm font-medium">{child.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {child._count.timeEntries} {child._count.timeEntries === 1 ? "entry" : "entries"}
                                <span className="mx-1">·</span>
                                <span className="font-mono">{formatDuration(child.totalDuration)}</span>
                              </p>
                            </div>
                          </div>
                          <div className="action-buttons flex gap-1">
                            <ProjectForm
                              project={{ ...child, parentId: child.parentId }}
                              trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => deleteProject(child.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
